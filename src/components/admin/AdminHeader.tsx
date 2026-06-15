"use client"

import Link from "next/link"
import { Search, Bell, Plus, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function AdminHeader({ profile }: { profile?: any }) {
  const supabase = createClient()
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState("")

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
    <header className="hidden md:flex h-16 bg-white border-b border-[#D8E2ED] items-center justify-between px-6 gap-4 sticky top-0 z-30">
      <form onSubmit={handleSearch} className="flex-1 max-w-xl relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7E94]" />
        <Input 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#F0F3F7] border-transparent text-[#162439] placeholder:text-[#6B7E94] focus-visible:ring-primary/20 rounded-lg pl-10 h-10" 
          placeholder="Buscar pacientes... (Presiona Enter)" 
        />
      </form>

      <div className="flex items-center gap-4 ml-auto">
        <Link href="/admin/appointments/new" className="hidden sm:flex">
          <Button className="bg-[#162439] hover:bg-[#1E304D] text-white">
            <Plus className="w-4 h-4 mr-2" /> Nueva Cita
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger className="relative p-2 text-[#6B7E94] hover:text-[#162439] hover:bg-[#F0F3F7] rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/20">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-4">
            <div className="flex flex-col text-center items-center py-6 px-2">
              <Bell className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-[#162439]">No hay notificaciones</p>
              <p className="text-xs text-muted-foreground mt-1">Te avisaremos cuando haya novedades en la clínica.</p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 hover:bg-[#F0F3F7] p-1.5 pr-3 rounded-full transition-colors focus:outline-none">
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
