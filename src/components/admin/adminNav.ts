import {
  LayoutDashboard, Users, Calendar, Sparkles, Gift, Settings, UserCheck, Megaphone,
  Zap, BarChart2, Bot, Package, Wallet, DoorOpen, LayoutGrid, ClipboardCheck, Shield, Handshake,
} from "lucide-react"

export type AdminRoute = { label: string; icon: typeof LayoutDashboard; href: string }

/** Navegación del panel — fuente única para el riel lateral y la barra de pestañas. */
export const ADMIN_ROUTES: AdminRoute[] = [
  { label: "Dashboard",        icon: LayoutDashboard, href: "/admin/dashboard"     },
  { label: "Mi Panel",         icon: LayoutGrid,      href: "/admin/workspace"     },
  { label: "Pacientes",        icon: Users,           href: "/admin/patients"      },
  { label: "Reservas",         icon: Calendar,        href: "/admin/appointments"  },
  { label: "Pendientes",       icon: ClipboardCheck,  href: "/admin/pending"       },
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
  { label: "Colaboraciones",   icon: Handshake,       href: "/admin/collaborations" },
  { label: "Administración",   icon: Shield,          href: "/admin/administration" },
  { label: "Configuración",    icon: Settings,        href: "/admin/settings"      },
]

/** Filtra rutas por rol/permisos (misma lógica que el sidebar). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function filterAdminRoutes(profile?: any, permissions?: any): AdminRoute[] {
  return ADMIN_ROUTES.filter((route) => {
    if (profile?.role === "clinic_admin") return true

    if (route.label === "Dashboard" && !permissions?.can_view_dashboard) return false
    if (route.label === "Pacientes" && !permissions?.can_manage_patients) return false
    if (route.label === "Reservas" && !permissions?.can_manage_appointments) return false
    if (route.label === "Servicios" && !permissions?.can_manage_services) return false
    if (route.label === "Reportes" && !permissions?.can_view_reports) return false

    if (["Equipo", "Automatizaciones", "Fidelidad", "Marketing", "Configuración", "Agente IA", "Inventario", "Caja", "Mi Panel", "Pendientes", "Colaboraciones", "Administración"].includes(route.label)) {
      if (profile?.role !== "clinic_admin") return false
    }
    return true
  })
}

/** ¿La ruta está activa para el pathname actual? */
export function isRouteActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/")
}
