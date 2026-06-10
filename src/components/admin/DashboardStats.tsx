"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Users, Calendar, UserPlus, Award, Clock, ArrowUpRight, Play, Settings, Plus, Star } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function DashboardStats() {
  const [activeTab, setActiveTab] = useState<"overview" | "appointments" | "notifications">("overview")

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard_stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard")
      if (!res.ok) throw new Error("Error loading dashboard data")
      return res.json()
    }
  })

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando dashboard...</div>
  }

  if (!data) return null

  const stats = data.stats
  const upcomingAppointments = data.upcomingAppointments

  const statCards = [
    {
      title: "Pacientes Totales",
      value: stats.activePatients,
      icon: Users,
      color: "text-primary",
      bgLight: "bg-primary/10",
      description: "Pacientes activos",
    },
    {
      title: "Citas Hoy",
      value: stats.todayAppointments,
      icon: Calendar,
      color: "text-blue-500",
      bgLight: "bg-blue-500/10",
      description: "Agendadas para hoy",
    },
    {
      title: "Nuevos Pacientes",
      value: stats.newPatientsThisMonth,
      icon: UserPlus,
      color: "text-purple-500",
      bgLight: "bg-purple-500/10",
      description: "Añadidos este mes",
    },
    {
      title: "Puntos Otorgados",
      value: stats.pointsGrantedThisMonth,
      icon: Award,
      color: "text-amber-500",
      bgLight: "bg-amber-500/10",
      description: "Puntos este mes",
    }
  ]

  return (
    <div className="bg-card rounded-xl shadow-sm border p-6 md:p-8 min-h-[500px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Resumen de Clínica</h1>
          <p className="text-slate-500 text-sm mt-1">
            Aquí está el resumen de tu clínica para hoy, {format(new Date(), "d 'de' MMMM", { locale: es })}.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button render={<Link href="/admin/patients/new" />} variant="outline" className="border-border">
            <Plus className="h-4 w-4 mr-2" />
            Crear Paciente
          </Button>
          <Button render={<Link href="/admin/appointments/new" />} className="bg-primary hover:bg-primary/90">
            <Calendar className="h-4 w-4 mr-2" />
            Nueva Cita
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-border mb-6 overflow-x-auto pb-px">
        <button 
          onClick={() => setActiveTab("overview")}
          className={`font-medium text-sm pb-2 border-b-2 whitespace-nowrap transition-colors ${activeTab === "overview" ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"}`}
        >
          Visión General
        </button>
        <button 
          onClick={() => setActiveTab("appointments")}
          className={`font-medium text-sm pb-2 border-b-2 whitespace-nowrap transition-colors ${activeTab === "appointments" ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"}`}
        >
          Próximas Citas
        </button>
        <button 
          onClick={() => setActiveTab("notifications")}
          className={`font-medium text-sm pb-2 border-b-2 whitespace-nowrap transition-colors ${activeTab === "notifications" ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"}`}
        >
          Notificaciones
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* KPIs */}
          <div>
            <h2 className="text-sm font-semibold text-slate-800 mb-4">Indicadores Principales</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((stat, i) => (
                <div key={i} className="rounded-lg p-4 border flex items-center gap-4 bg-background">
                  <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${stat.bgLight}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{stat.title}</p>
                    <h3 className="text-xl font-bold text-slate-800">{stat.value}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Citas y Accesos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h2 className="text-sm font-semibold text-slate-800 mb-4">Próximas Citas (Hoy)</h2>
              <div className="space-y-3">
                {upcomingAppointments.length === 0 ? (
                  <div className="p-8 text-center border rounded-lg bg-background">
                    <p className="text-muted-foreground text-sm">No hay más citas programadas para hoy.</p>
                  </div>
                ) : (
                  upcomingAppointments.map((apt: any) => (
                    <div key={apt.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-background hover:border-primary/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                          {apt.patient.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{apt.patient.full_name}</p>
                          <p className="text-xs text-muted-foreground">{apt.service?.name}</p>
                        </div>
                      </div>
                      <div className="mt-2 sm:mt-0 flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-800">
                            {format(new Date(apt.scheduled_at), "HH:mm")}
                          </p>
                          <p className="text-xs text-muted-foreground">{apt.duration_minutes} min</p>
                        </div>
                        <Button variant="ghost" size="sm" render={<Link href={`/admin/appointments/${apt.id}`} />} className="text-primary hover:text-primary">
                          Ver
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-800 mb-4">Accesos Rápidos</h2>
              <div className="space-y-3">
                <Link href="/admin/patients/new" className="flex items-center gap-3 p-3 border rounded-lg bg-background hover:border-primary/50 transition-colors group">
                  <div className="p-2 bg-primary/10 rounded text-primary">
                    <UserPlus className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-primary transition-colors">Crear Paciente</p>
                    <p className="text-xs text-muted-foreground">Añadir nueva ficha médica</p>
                  </div>
                </Link>

                <Link href="/admin/loyalty" className="flex items-center gap-3 p-3 border rounded-lg bg-background hover:border-primary/50 transition-colors group">
                  <div className="p-2 bg-purple-500/10 rounded text-purple-600">
                    <Star className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-primary transition-colors">Otorgar Puntos</p>
                    <p className="text-xs text-muted-foreground">Programa de fidelidad</p>
                  </div>
                </Link>
                
                <Link href="/admin/settings" className="flex items-center gap-3 p-3 border rounded-lg bg-background hover:border-primary/50 transition-colors group">
                  <div className="p-2 bg-slate-100 rounded text-slate-600">
                    <Settings className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-primary transition-colors">Configuración</p>
                    <p className="text-xs text-muted-foreground">Ajustes de la clínica</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "appointments" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Todas las citas de hoy</h2>
            <Button variant="outline" size="sm" render={<Link href="/admin/appointments" />}>Ver Calendario Completo</Button>
          </div>
          <div className="space-y-3">
            {upcomingAppointments.length === 0 ? (
              <div className="p-12 text-center border rounded-lg bg-background">
                <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No hay citas para hoy</p>
              </div>
            ) : (
              upcomingAppointments.map((apt: any) => (
                <div key={apt.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-background hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                      {apt.patient.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{apt.patient.full_name}</p>
                      <p className="text-xs text-muted-foreground">{apt.service?.name} • {apt.duration_minutes} minutos</p>
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-0 flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">
                        {format(new Date(apt.scheduled_at), "HH:mm")}
                      </p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                        {apt.status}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" render={<Link href={`/admin/appointments/${apt.id}`} />} className="text-primary hover:text-primary">
                      Gestionar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="p-16 text-center border border-dashed rounded-xl bg-slate-50/50">
            <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm border mx-auto mb-4">
              <Star className="h-5 w-5 text-slate-400" />
            </div>
            <h3 className="text-slate-800 font-semibold mb-1">Sin notificaciones nuevas</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Todo está al día. Aquí aparecerán alertas sobre cancelaciones, stock o actualizaciones del sistema.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
