"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Calendar, Sparkles, Gift, Settings, LogOut, Menu } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin/dashboard",
    color: "text-primary",
  },
  {
    label: "Pacientes",
    icon: Users,
    href: "/admin/patients",
    color: "text-primary",
  },
  {
    label: "Reservas",
    icon: Calendar,
    href: "/admin/appointments",
    color: "text-primary",
  },
  {
    label: "Servicios",
    icon: Sparkles,
    href: "/admin/services",
    color: "text-primary",
  },
  {
    label: "Fidelidad",
    icon: Gift,
    href: "/admin/loyalty",
    color: "text-primary",
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex h-full flex-col">
      <div className="px-4 py-6">
        <div className="mb-10 flex flex-col items-start gap-2 pl-2">
          <Link href="/admin/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-lg shadow-primary/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Clínica
            </h1>
          </Link>
          <span className="ml-12 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">
            Admin
          </span>
        </div>
        <div className="space-y-1.5">
          {routes.map((route) => {
            const isActive = pathname === route.href || pathname.startsWith(route.href + '/')
            return (
              <Link
                key={route.href}
                href={route.href}
                onClick={() => isMobile && setOpen(false)}
                className="relative group block"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary/10 dark:bg-primary/20 rounded-xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div
                  className={cn(
                    "relative flex w-full items-center gap-x-3 rounded-xl p-3 text-sm font-semibold transition-colors duration-200",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <route.icon className={cn("h-5 w-5 transition-transform duration-200", isActive ? "scale-110" : "group-hover:scale-110")} />
                  {route.label}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
      <div className="mt-auto px-4 pb-6">
        <button
          onClick={handleLogout}
          className="group flex w-full items-center gap-x-3 rounded-xl p-3 text-sm font-semibold text-muted-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-5 w-5 transition-transform duration-200 group-hover:scale-110 group-hover:-translate-x-1" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar - Floating Glass */}
      <div className="hidden md:flex h-screen w-72 flex-col fixed left-0 top-0 bottom-0 z-40 p-4">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex-1 glass-card rounded-3xl overflow-hidden flex flex-col border border-white/40 dark:border-white/10"
        >
          <SidebarContent />
        </motion.div>
      </div>
      {/* Spacer for fixed sidebar */}
      <div className="hidden md:block w-72 flex-shrink-0" />

      {/* Mobile Header - Glassmorphism */}
      <div 
        className={cn(
          "md:hidden flex items-center justify-between p-4 w-full sticky top-0 z-50 transition-all duration-300",
          scrolled ? "glass border-b border-border shadow-sm" : "bg-transparent"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-sm shadow-primary/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
            Clínica
          </h1>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="hover:bg-muted/50 rounded-xl" />}>
            <Menu className="h-6 w-6" />
          </SheetTrigger>
          <SheetContent side="left" className="glass-card p-0 border-r-white/20 dark:border-r-white/10 sm:max-w-xs">
            <SheetHeader className="sr-only">
              <SheetTitle>Menú de navegación</SheetTitle>
            </SheetHeader>
            <SidebarContent isMobile />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
