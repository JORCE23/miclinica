"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Calendar, Sparkles, Gift, LogOut, Menu, Search, Bell, Settings, Activity } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin/dashboard",
  },
  {
    label: "Pacientes",
    icon: Users,
    href: "/admin/patients",
  },
  {
    label: "Reservas",
    icon: Calendar,
    href: "/admin/appointments",
  },
  {
    label: "Servicios",
    icon: Sparkles,
    href: "/admin/services",
  },
  {
    label: "Fidelidad",
    icon: Gift,
    href: "/admin/loyalty",
  },
  {
    label: "Configuración",
    icon: Settings,
    href: "/admin/settings",
  },
]

export function AdminTopNav({ profile }: { profile?: any }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  const NavLinks = ({ isMobile = false }) => (
    <>
      {routes.map((route) => {
        const isActive = pathname === route.href || pathname.startsWith(route.href + '/')
        return (
          <Link
            key={route.href}
            href={route.href}
            onClick={() => isMobile && setOpen(false)}
            className={cn(
              "flex items-center gap-2 text-sm font-medium transition-colors border-b-2 py-3 px-2 md:py-4",
              isActive 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
              isMobile && "w-full border-none py-3"
            )}
          >
            <route.icon className="h-4 w-4" />
            {route.label}
          </Link>
        )
      })}
    </>
  )

  return (
    <div className="flex flex-col w-full z-40 sticky top-0">
      {/* Top Bar - Premium Gradient */}
      <div className="bg-gradient-to-r from-primary to-teal-700 text-primary-foreground h-16 flex items-center justify-between px-4 md:px-6 shadow-md border-b border-white/10 relative z-20">
        <div className="flex items-center gap-2">
          {/* Mobile Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground" />}>
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="text-left flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> Mi Clínica
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2 py-6 h-full">
                <NavLinks isMobile />
                <button
                  onClick={handleLogout}
                  className="mt-auto flex items-center gap-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 p-3 rounded-md"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <div className="bg-white/20 p-1.5 rounded-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span>Myclinic</span>
          </Link>
        </div>

        {/* Search Bar (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-2xl px-8 relative">
          <Search className="absolute left-11 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-foreground/60" />
          <Input 
            className="w-full bg-primary-foreground/10 border-transparent text-primary-foreground placeholder:text-primary-foreground/60 focus-visible:ring-primary-foreground/20 focus-visible:bg-primary-foreground/20 rounded-md pl-10 h-9" 
            placeholder="Busca pacientes por nombre o documento de ID" 
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-4 text-sm font-medium">
          <DropdownMenu>
            <DropdownMenuTrigger render={<button className="hidden md:flex items-center gap-2 hover:bg-white/15 px-3 py-2 rounded-lg transition-all shadow-sm border border-transparent hover:border-white/20" />}>
              <div className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-primary"></span>
              </div>
              <span className="hidden lg:inline">Novedades</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-2 rounded-xl shadow-xl border-border/50">
              <div className="font-bold text-slate-800 px-2 py-1.5 text-sm">Actualizaciones</div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 rounded-lg hover:bg-muted/50 cursor-default focus:bg-muted/50">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                  <span className="font-semibold text-sm">Nuevas funciones de agenda</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pl-4">
                  Pronto agregaremos recordatorios automáticos por WhatsApp. ¡Mantente atento!
                </p>
                <span className="text-[10px] text-muted-foreground/60 pl-4 mt-1">Hace 2 horas</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 rounded-lg hover:bg-muted/50 cursor-default focus:bg-muted/50">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-slate-300"></span>
                  <span className="font-semibold text-sm text-slate-600">Sistema actualizado</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pl-4">
                  Mejoras de rendimiento y seguridad implementadas exitosamente.
                </p>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Link href="/admin/settings" className="hidden md:flex items-center gap-3 hover:bg-white/15 px-3 py-2 rounded-lg cursor-pointer transition-all border-l border-white/20 pl-4">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-7 h-7 rounded-full object-cover border-2 border-white/50 shadow-sm" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold border-2 border-white/50 shadow-sm">
                {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-bold leading-none">{profile?.full_name?.split(" ")[0] || "Admin"}</span>
              <span className="text-[10px] text-white/70 font-normal leading-none mt-1">Mi Perfil</span>
            </div>
          </Link>

          <button onClick={handleLogout} className="hidden md:flex items-center gap-2 hover:bg-red-500/20 hover:text-red-100 px-3 py-2 rounded-lg transition-all border-l border-white/20 pl-4">
            <LogOut className="h-4 w-4" />
            <span className="hidden lg:inline font-semibold">Salir</span>
          </button>
        </div>
      </div>

      {/* Sub Navigation Bar - White */}
      <div className="hidden md:flex bg-white border-b px-6 shadow-sm relative z-10">
        <nav className="flex items-center gap-8 overflow-x-auto">
          <NavLinks />
        </nav>
      </div>
    </div>
  )
}
