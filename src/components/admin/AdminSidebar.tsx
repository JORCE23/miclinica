"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Calendar, Sparkles, Gift, Settings, LogOut, Menu, UserCheck, Megaphone, Zap, BarChart2, ChevronLeft, ChevronRight } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

const routes = [
  { label: "Dashboard",        icon: LayoutDashboard, href: "/admin/dashboard"     },
  { label: "Pacientes",        icon: Users,           href: "/admin/patients"      },
  { label: "Reservas",         icon: Calendar,        href: "/admin/appointments"  },
  { label: "Servicios",        icon: Sparkles,        href: "/admin/services"      },
  { label: "Equipo",           icon: UserCheck,       href: "/admin/professionals" },
  { label: "Fidelidad",        icon: Gift,            href: "/admin/loyalty"       },
  { label: "Marketing",        icon: Megaphone,       href: "/admin/marketing"     },
  { label: "Automatizaciones", icon: Zap,             href: "/admin/automations"   },
  { label: "Reportes",         icon: BarChart2,       href: "/admin/reports"       },
  { label: "Configuración",    icon: Settings,        href: "/admin/settings"      },
]

export function AdminSidebar({ profile, permissions }: { profile?: any, permissions?: any }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  // Persistencia del estado colapsado (solo UI, no afecta la lógica)
  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("medique:sidebar-collapsed") : null
    if (stored === "true") setCollapsed(true)
  }, [])

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      if (typeof window !== "undefined") {
        window.localStorage.setItem("medique:sidebar-collapsed", String(next))
      }
      return next
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  const filteredRoutes = routes.filter(route => {
    if (profile?.role === 'clinic_admin') return true

    // Si es staff, revisamos los permisos
    if (route.label === "Dashboard" && !permissions?.can_view_dashboard) return false
    if (route.label === "Pacientes" && !permissions?.can_manage_patients) return false
    if (route.label === "Reservas" && !permissions?.can_manage_appointments) return false
    if (route.label === "Servicios" && !permissions?.can_manage_services) return false
    if (route.label === "Reportes" && !permissions?.can_view_reports) return false

    // Rutas exclusivas para admin
    if (["Equipo", "Automatizaciones", "Fidelidad", "Marketing", "Configuración"].includes(route.label)) {
      if (profile?.role !== 'clinic_admin') return false
    }

    return true
  })

  const SidebarLinks = ({ isMobile = false, isCollapsed = false }) => (
    <>
      {filteredRoutes.map((route) => {
        const isActive = pathname === route.href || pathname.startsWith(route.href + '/')
        return (
          <Link
            key={route.href}
            href={route.href}
            onClick={() => isMobile && setOpen(false)}
            title={isCollapsed ? route.label : undefined}
            className={cn(
              "group relative flex items-center gap-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              isCollapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5",
              isActive
                ? "bg-white/[0.08] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
                : "text-white/55 hover:bg-white/[0.05] hover:text-white"
            )}
          >
            {/* Indicador de activo */}
            <span
              className={cn(
                "absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-steel transition-all duration-200",
                isActive ? "opacity-100" : "opacity-0"
              )}
            />
            <route.icon className={cn("h-[18px] w-[18px] shrink-0 transition-transform", isActive && "text-white")} />
            {!isCollapsed && <span className="truncate">{route.label}</span>}
          </Link>
        )
      })}
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "relative bg-[#162439] text-white flex-col hidden md:flex sticky top-0 h-screen shrink-0 border-r border-white/[0.06] transition-[width] duration-300 ease-in-out sidebar-scroll overflow-y-auto overflow-x-hidden",
          collapsed ? "w-[76px]" : "w-60"
        )}
      >
        {/* Botón de colapsar/expandir */}
        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          className="absolute -right-3 top-7 z-20 hidden md:flex h-6 w-6 items-center justify-center rounded-full bg-[#1E304D] text-white/80 border border-white/10 shadow-md hover:bg-steel hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>

        <div className={cn("border-b border-white/[0.06] flex justify-center items-center transition-all", collapsed ? "px-2 py-5" : "px-4 py-6")}>
          <Link href="/admin/dashboard" className="flex items-center w-full justify-center">
            {collapsed ? (
              <img src="/logo-medique-simbolo.png" alt="Medique" className="w-9 h-9 object-contain" />
            ) : (
              <img src="/logo3.png" alt="Medique Logo" className="w-[180px] h-auto object-contain" />
            )}
          </Link>
        </div>

        <nav className={cn("flex-1 py-5 space-y-1", collapsed ? "px-2.5" : "px-3")}>
          <SidebarLinks isCollapsed={collapsed} />
        </nav>

        <div className={cn("border-t border-white/[0.06]", collapsed ? "px-2 py-4" : "px-4 py-5")}>
          {!collapsed && (
            <div className="flex items-center gap-3 px-2">
              <p className="text-[11px] leading-relaxed text-white/35">Software + Marketing para Clínicas Estéticas</p>
            </div>
          )}
          {collapsed && (
            <div className="flex justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Header/Trigger (Only visible on small screens) */}
      <div className="md:hidden flex items-center justify-between p-3 bg-[#162439] text-white sticky top-0 z-50 shadow-md">
        <Link href="/admin/dashboard" className="flex items-center w-[60%] max-w-[140px]">
          <img src="/logo3.png" alt="Medique Logo" className="h-auto w-full object-contain" />
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="text-white hover:bg-white/10" />}>
            <Menu className="h-6 w-6" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-[320px] bg-[#162439] text-white border-r-white/10 p-0 flex flex-col sidebar-scroll">
            <SheetHeader className="p-4 border-b border-white/10 flex justify-center items-center">
              <SheetTitle className="text-white flex items-center justify-center w-full">
                <img src="/logo3.png" alt="Medique Logo" className="w-[70%] max-w-[200px] h-auto object-contain" />
              </SheetTitle>
            </SheetHeader>
            <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
              <SidebarLinks isMobile />
            </nav>
            <div className="p-4 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-red-400 hover:bg-white/5 w-full text-left"
              >
                <LogOut className="h-5 w-5" />
                Cerrar sesión
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
