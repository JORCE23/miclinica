"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Calendar, Sparkles, Gift, Settings, LogOut, Menu, UserCheck, Megaphone, Zap, BarChart2, Bot, Package, Wallet, DoorOpen, LayoutGrid } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ThemeToggle"
import { useState } from "react"

const routes = [
  { label: "Dashboard",        icon: LayoutDashboard, href: "/admin/dashboard"     },
  { label: "Mi Panel",         icon: LayoutGrid,      href: "/admin/workspace"     },
  { label: "Pacientes",        icon: Users,           href: "/admin/patients"      },
  { label: "Reservas",         icon: Calendar,        href: "/admin/appointments"  },
  { label: "Sala de espera",   icon: DoorOpen,        href: "/admin/waiting-room"  },
  { label: "Caja",             icon: Wallet,          href: "/admin/cash"          },
  { label: "Servicios",        icon: Sparkles,        href: "/admin/services"      },
  { label: "Inventario",       icon: Package,         href: "/admin/inventory"     },
  { label: "Equipo",           icon: UserCheck,       href: "/admin/professionals" },
  { label: "Fidelidad",        icon: Gift,            href: "/admin/loyalty"       },
  { label: "Marketing",        icon: Megaphone,       href: "/admin/marketing"     },
  { label: "Automatizaciones", icon: Zap,             href: "/admin/automations"   },
  { label: "Agente IA",        icon: Bot,             href: "/admin/ai-agent"      },
  { label: "Reportes",         icon: BarChart2,       href: "/admin/reports"       },
  { label: "Configuración",    icon: Settings,        href: "/admin/settings"      },
]

export function AdminSidebar({ profile, permissions }: { profile?: any, permissions?: any }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(false)

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
    if (["Equipo", "Automatizaciones", "Fidelidad", "Marketing", "Configuración", "Agente IA", "Inventario", "Caja", "Mi Panel"].includes(route.label)) {
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
              "group relative flex items-center gap-2.5 rounded-full text-sm font-medium transition-all duration-200",
              isCollapsed ? "justify-center px-0 py-2.5" : "px-4 py-2.5",
              isActive
                ? "bg-brand/10 text-brand"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <route.icon className={cn("h-[18px] w-[18px] shrink-0 transition-transform group-hover:scale-105", isActive ? "text-brand" : "")} />
            {!isCollapsed && <span className="truncate">{route.label}</span>}
          </Link>
        )
      })}
    </>
  )

  // El menú se expande al pasar el mouse (hover-to-expand) y empuja el contenido.
  const expanded = hovered

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "bg-card text-foreground flex-col hidden md:flex sticky top-0 h-screen shrink-0 rounded-r-[28px] border-r border-border transition-[width] duration-300 ease-in-out sidebar-scroll overflow-y-auto overflow-x-hidden",
          expanded ? "w-60 shadow-xl shadow-black/5" : "w-[76px]"
        )}
      >
        <div className={cn("flex justify-center items-center transition-all", expanded ? "px-5 pt-7 pb-5" : "px-2 pt-6 pb-4")}>
          <Link href="/admin/dashboard" className="flex items-center w-full justify-center">
            <span className="font-display font-semibold text-foreground tracking-tight whitespace-nowrap" style={{ fontSize: expanded ? 26 : 22 }}>
              {expanded ? "Medique" : "M"}
            </span>
          </Link>
        </div>

        <nav className={cn("flex-1 py-5 space-y-1", expanded ? "px-3" : "px-2.5")}>
          <SidebarLinks isCollapsed={!expanded} />
        </nav>

        <div className={cn("border-t border-border", expanded ? "px-4 py-5" : "px-2 py-4")}>
          {expanded ? (
            <div className="flex items-center gap-3 px-2">
              <p className="text-[11px] leading-relaxed text-muted-foreground">Software + Marketing para Clínicas Estéticas</p>
            </div>
          ) : (
            <div className="flex justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
            </div>
          )}
        </div>
      </aside>

      {/* Header móvil — menú a la izquierda, modo oscuro + "Medique" a la derecha */}
      <div className="md:hidden flex items-center justify-between gap-2 p-3 bg-card text-foreground border-b border-border sticky top-0 z-50 shadow-sm">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="text-foreground hover:bg-muted" />}>
            <Menu className="h-6 w-6" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-[320px] bg-card text-foreground border-r-border p-0 flex flex-col sidebar-scroll">
            <SheetHeader className="p-5 border-b border-border">
              <SheetTitle className="font-display text-2xl font-semibold text-foreground tracking-tight text-left">Medique</SheetTitle>
            </SheetHeader>
            <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
              <SidebarLinks isMobile />
            </nav>
            <div className="p-4 border-t border-border">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-colors text-red-600 hover:bg-muted w-full text-left"
              >
                <LogOut className="h-5 w-5" />
                Cerrar sesión
              </button>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <ThemeToggle className="text-muted-foreground hover:text-foreground hover:bg-muted" />
          <Link href="/admin/dashboard" className="font-display text-xl font-semibold text-foreground tracking-tight pr-1">
            Medique
          </Link>
        </div>
      </div>
    </>
  )
}
