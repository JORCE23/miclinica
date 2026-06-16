"use client"

import Link from "next/link"
import { Search, Bell, Plus, LogOut, Package, CalendarClock, Calendar, Cake, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/admin/patients?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className="hidden md:flex h-16 bg-white/80 backdrop-blur-md border-b border-[#D8E2ED]/70 items-center justify-between px-6 gap-4 sticky top-0 z-30">
      <form onSubmit={handleSearch} className="flex-1 max-w-xl relative hidden md:block">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7E94] pointer-events-none" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#F0F3F7] border-transparent text-[#162439] placeholder:text-[#6B7E94] focus-visible:ring-2 focus-visible:ring-primary/15 focus-visible:bg-white focus-visible:border-[#D8E2ED] rounded-xl pl-10 h-10 transition-all"
          placeholder="Buscar pacientes... (Presiona Enter)"
        />
      </form>

      <div className="flex items-center gap-3 ml-auto">
        <Link href="/admin/appointments/new" className="hidden sm:flex">
          <Button className="bg-[#162439] hover:bg-[#1E304D] text-white rounded-xl shadow-soft transition-all hover:shadow-md">
            <Plus className="w-4 h-4 mr-2" /> Nueva Cita
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger className="relative p-2 text-[#6B7E94] hover:text-[#162439] hover:bg-[#F0F3F7] rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/20">
            <Bell className="h-5 w-5" />
            {notifItems.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center">
                {notifItems.length}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30">
              <p className="text-sm font-semibold text-[#162439]">Notificaciones</p>
            </div>
            {notifItems.length === 0 ? (
              <div className="flex flex-col text-center items-center py-8 px-2">
                <Bell className="h-8 w-8 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-[#162439]">Todo al día</p>
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
                        <p className="text-sm font-medium text-[#162439] leading-snug">{n.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{n.description}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 hover:bg-[#F0F3F7] p-1.5 pr-3 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#7B9AB5] flex items-center justify-center text-xs font-bold text-white">
                {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
            <div className="hidden md:flex flex-col text-left">
              <span className="text-sm font-semibold text-[#162439] leading-none">{profile?.full_name?.split(" ")[0] || "Admin"}</span>
              <span className="text-[10px] text-[#6B7E94] mt-0.5">Mi Perfil</span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem className="cursor-pointer" render={<Link href="/admin/settings" className="w-full" />}>
              Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
