"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Sparkles, Calendar, Gift, User, LogOut, Menu } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const routes = [
  {
    label: "Inicio",
    href: "/client/dashboard",
    icon: Sparkles,
  },
  {
    label: "Mis Citas",
    href: "/client/appointments",
    icon: Calendar,
  },
  {
    label: "Mis Puntos",
    href: "/client/loyalty",
    icon: Gift,
  },
  {
    label: "Mi Perfil",
    href: "/client/profile",
    icon: User,
  },
]

export function ClientNav({ userName }: { userName?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          onClick={() => mobile && setOpen(false)}
          className={cn(
            "flex items-center gap-2 text-sm font-medium transition-colors hover:text-rose-600",
            pathname === route.href
              ? "text-rose-600 dark:text-rose-400"
              : "text-slate-600 dark:text-slate-400"
          )}
        >
          <route.icon className="h-4 w-4" />
          {route.label}
        </Link>
      ))}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors hover:text-red-600 mt-auto md:mt-0"
      >
        <LogOut className="h-4 w-4" />
        Cerrar Sesión
      </button>
    </>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-slate-950/95 dark:supports-[backdrop-filter]:bg-slate-950/60 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-rose-500" />
          <div className="flex flex-col">
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-violet-500 leading-none">
              Mi Clínica
            </span>
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mt-0.5">
              Portal Paciente
            </span>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <NavLinks />
        </nav>

        {/* Mobile Nav */}
        <div className="flex md:hidden items-center gap-4">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="text-left flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-rose-500" /> Mi Clínica
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-6 py-8 h-full">
                {userName && (
                  <p className="text-sm text-muted-foreground pb-4 border-b">
                    Hola, <span className="font-semibold text-foreground">{userName}</span>
                  </p>
                )}
                <NavLinks mobile />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
