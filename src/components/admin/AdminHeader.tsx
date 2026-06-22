"use client"

import Link from "next/link"
import { Search, Bell, Plus, LogOut, Package, CalendarClock, Calendar, Cake, AlertTriangle, ChevronDown, User, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/ThemeToggle"
import { filterAdminRoutes, isRouteActive } from "@/components/admin/adminNav"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import { useAdminModals } from "@/components/admin/AdminModals"
import { useState, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

type Notif = { id: string; type: string; severity: "info" | "warning" | "danger"; title: string; description: string; href: string }

const NOTIF_ICON: Record<string, typeof Bell> = {
  inventario: Package, vencimiento: CalendarClock, agenda: Calendar, "cumpleaños": Cake,
}
const SEV_CLS: Record<string, string> = {
  danger: "bg-red-100 text-red-600", warning: "bg-amber-100 text-amber-600", info: "bg-brand-soft text-brand-dark",
}

export function AdminHeader({ profile }: { profile?: any }) {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const { openAppointment } = useAdminModals()
  const routes = filterAdminRoutes(profile, null)

  const [searchQuery, setSearchQuery] = useState("")

  const { data: notifs } = useQuery<{ count: number; items: Notif[] }>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const r = await fetch("/api/notifications")
      return r.ok ? r.json() : { count: 0, items: [] }
    },
    refetchInterval: 60000,
  })
  const notifItems = notifs?.items || []

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const changeAvatar = async (file?: File | null) => {
    if (!file) return
    if (!file.type.startsWith("image/")) { toast.error("Selecciona una imagen"); return }
    if (file.size > 5 * 1024 * 1024) { toast.error("La imagen no puede superar 5 MB"); return }
    setUploadingAvatar(true)
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase()
      const path = `avatars/users/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`
      const { error } = await supabase.storage.from("clinical_photos").upload(path, file, { upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from("clinical_photos").getPublicUrl(path)
      const res = await fetch("/api/account/avatar", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: publicUrl }),
      })
      if (!res.ok) throw new Error()
      toast.success("Foto de perfil actualizada")
      router.refresh()
    } catch {
      toast.error("No se pudo actualizar la foto")
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/admin/patients?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className="hidden md:block bg-background/75 backdrop-blur-xl border-b border-border sticky top-0 z-30">
      <div className="flex h-16 items-center justify-between px-5 gap-4">
      <form onSubmit={handleSearch} className="flex-1 max-w-md relative hidden md:block">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-muted border-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-brand/15 focus-visible:bg-background focus-visible:border-brand/30 rounded-xl pl-10 h-10 transition-all"
          placeholder="Buscar pacientes..."
        />
      </form>

      <div className="flex items-center gap-2 ml-auto">
        <Button onClick={() => openAppointment()} className="hidden sm:flex bg-brand text-white hover:bg-brand-dark rounded-xl shadow-glow transition-all font-medium">
          <Plus className="w-4 h-4 mr-1.5" /> Nueva Cita
        </Button>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger className="relative h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand/20">
            <Bell className="h-[18px] w-[18px]" />
            {notifItems.length > 0 && (
              <span className="absolute top-1 right-1 min-w-[17px] h-[17px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-background flex items-center justify-center">
                {notifItems.length}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30">
              <p className="text-sm font-semibold text-foreground">Notificaciones</p>
            </div>
            {notifItems.length === 0 ? (
              <div className="flex flex-col text-center items-center py-8 px-2">
                <Bell className="h-8 w-8 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-foreground">Todo al día</p>
                <p className="text-xs text-muted-foreground mt-1">No hay novedades por ahora.</p>
              </div>
            ) : (
              <div className="max-h-[360px] overflow-y-auto py-1">
                {notifItems.map((n) => {
                  const Icon = NOTIF_ICON[n.type] || AlertTriangle
                  return (
                    <Link key={n.id} href={n.href} className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${SEV_CLS[n.severity]}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground leading-snug">{n.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{n.description}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-7 w-px bg-border mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger className="group/profile flex items-center gap-2.5 hover:bg-muted py-1 pl-1 pr-2.5 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/20">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-9 h-9 rounded-xl object-cover ring-2 ring-white shadow-soft" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2E7FB0] to-[#5BA3CE] flex items-center justify-center text-sm font-bold text-white ring-2 ring-white shadow-soft">
                {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
            <div className="hidden md:flex flex-col text-left leading-tight">
              <span className="text-sm font-semibold text-foreground leading-none">{profile?.full_name?.split(" ")[0] || "Admin"}</span>
              <span className="text-[11px] text-muted-foreground mt-0.5">Mi Perfil</span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]/profile:rotate-180" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 p-0 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-10 h-10 rounded-xl object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2E7FB0] to-[#5BA3CE] flex items-center justify-center text-sm font-bold text-white">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{profile?.full_name || "Admin"}</p>
                <p className="text-xs text-muted-foreground">Administrador</p>
              </div>
            </div>
            <div className="p-1">
              <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => avatarInputRef.current?.click()}>
                <Camera className="h-4 w-4 mr-2 text-muted-foreground" /> {uploadingAvatar ? "Subiendo…" : "Cambiar foto"}
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer rounded-lg" render={<Link href="/admin/settings" className="w-full" />}>
                <User className="h-4 w-4 mr-2 text-muted-foreground" /> Configuración
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 cursor-pointer rounded-lg" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" /> Cerrar sesión
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => changeAvatar(e.target.files?.[0])} />
      </div>
      </div>

      {/* Barra de pestañas (navegación rápida tipo prototipo) */}
      <div className="flex items-center gap-2 px-5 pb-2.5">
        <div className="flex-1 flex gap-1.5 overflow-x-auto sidebar-scroll">
          {routes.map((r) => {
            const active = isRouteActive(pathname, r.href)
            return (
              <Link
                key={r.href}
                href={r.href}
                className={cn(
                  "shrink-0 px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap border transition-colors",
                  active
                    ? "bg-brand text-white border-brand"
                    : "text-muted-foreground border-border hover:text-foreground hover:border-brand/40"
                )}
              >
                {r.label}
              </Link>
            )
          })}
        </div>
      </div>
    </header>
  )
}
