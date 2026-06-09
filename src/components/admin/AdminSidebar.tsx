"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Calendar, Sparkles, Gift, Settings, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin/dashboard",
    color: "text-sky-500",
  },
  {
    label: "Pacientes",
    icon: Users,
    href: "/admin/patients",
    color: "text-violet-500",
  },
  {
    label: "Reservas",
    icon: Calendar,
    href: "/admin/appointments",
    color: "text-pink-700",
  },
  {
    label: "Servicios",
    icon: Sparkles,
    href: "/admin/services",
    color: "text-orange-700",
  },
  {
    label: "Fidelidad",
    icon: Gift,
    href: "/admin/loyalty",
    color: "text-emerald-500",
  },
  {
    label: "Configuración",
    icon: Settings,
    href: "/admin/settings",
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex h-full flex-col">
      <div className="px-3 py-2">
        <div className="mb-14">
          <Link href="/admin/dashboard" onClick={() => setOpen(false)} className="flex items-center pl-3">
            <h1 className="text-2xl font-bold">Mi Clínica</h1>
          </Link>
          <div className="pl-3 mt-1">
            <span className="bg-sky-500/20 text-sky-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Modo Administrador
            </span>
          </div>
        </div>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              onClick={() => isMobile && setOpen(false)}
              className={cn(
                "group flex w-full cursor-pointer justify-start rounded-lg p-3 text-sm font-medium transition hover:bg-white/10 hover:text-white",
                pathname === route.href ? "bg-white/10 text-white" : "text-zinc-400"
              )}
            >
              <div className="flex flex-1 items-center gap-x-3">
                <route.icon className={cn("h-5 w-5", route.color)} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="mt-auto px-3 pb-4 md:pb-0">
        <button
          onClick={handleLogout}
          className="group flex w-full cursor-pointer justify-start rounded-lg p-3 text-sm font-medium text-zinc-400 transition hover:bg-white/10 hover:text-white"
        >
          <div className="flex flex-1 items-center gap-x-3">
            <LogOut className="h-5 w-5 text-red-500" />
            Cerrar sesión
          </div>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-screen w-72 flex-col space-y-4 bg-slate-900 py-4 text-white">
        <SidebarContent />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 text-white shadow-sm w-full sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Mi Clínica</h1>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="text-white hover:bg-white/10" />}>
            <Menu className="h-6 w-6" />
          </SheetTrigger>
          <SheetContent side="left" className="bg-slate-900 text-white border-r-slate-800 p-0 pt-6">
            <SheetHeader className="sr-only">
              <SheetTitle>Menú</SheetTitle>
            </SheetHeader>
            <SidebarContent isMobile />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
