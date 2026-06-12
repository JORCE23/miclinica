"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Calendar, Sparkles, Gift, Settings, LogOut, Menu, UserCheck, Megaphone, Zap, BarChart2 } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useState } from "react"

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

export function AdminSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const SidebarLinks = ({ isMobile = false }) => (
    <>
      {routes.map((route) => {
        const isActive = pathname === route.href || pathname.startsWith(route.href + '/')
        return (
          <Link
            key={route.href}
            href={route.href}
            onClick={() => isMobile && setOpen(false)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              isActive 
                ? "bg-white/10 text-white" 
                : "text-white/60 hover:bg-white/5 hover:text-white"
            )}
          >
            <route.icon className="h-5 w-5" />
            {route.label}
          </Link>
        )
      })}
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-72 bg-[#162439] text-white flex-col hidden md:flex sticky top-0 h-screen overflow-y-auto shrink-0">
        <div className="px-4 py-8 border-b border-white/10 flex justify-center items-center">
          <Link href="/admin/dashboard" className="flex items-center w-full justify-center">
            <img src="/logo3.png" alt="Medique Logo" className="w-[260px] h-auto object-contain" />
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          <SidebarLinks />
        </nav>

        <div className="px-4 py-6 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-2">
             <p className="text-xs text-white/40">Software + Marketing para Clínicas Estéticas</p>
          </div>
        </div>
      </aside>

      {/* Mobile Header/Trigger (Only visible on small screens) */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#162439] text-white sticky top-0 z-50">
        <Link href="/admin/dashboard" className="flex items-center gap-1">
          <img src="/logo3.png" alt="Medique Logo" className="h-12 w-auto object-contain" />
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="text-white hover:bg-white/10" />}>
            <Menu className="h-6 w-6" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[320px] bg-[#162439] text-white border-r-white/10 p-0 flex flex-col">
            <SheetHeader className="p-4 border-b border-white/10 text-center flex justify-center items-center">
              <SheetTitle className="text-white flex items-center justify-center w-full">
                <img src="/logo3.png" alt="Medique Logo" className="w-[260px] h-auto object-contain" />
              </SheetTitle>
            </SheetHeader>
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              <SidebarLinks isMobile />
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
