"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Users, Calendar, UserPlus, Settings, Plus, Star, DollarSign, ArrowUpRight, TrendingUp } from "lucide-react"
import { format, isToday, isTomorrow } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"

// Removed mockRevenueData to use real data from the API

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

  const formatAppointmentDate = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) return `Hoy, ${format(date, "HH:mm")}`
    if (isTomorrow(date)) return `Mañana, ${format(date, "HH:mm")}`
    return format(date, "dd MMM, HH:mm", { locale: es })
  }

  const statCards = [
    {
      title: "Pacientes Totales",
      value: stats.activePatients,
      icon: Users,
      color: "text-primary",
      bgLight: "bg-primary/10",
      gradient: "from-[#0D9488] to-[#2DD4BF]",
      description: "Pacientes activos",
    },
    {
      title: "Citas Hoy",
      value: stats.todayAppointments,
      icon: Calendar,
      color: "text-blue-500",
      bgLight: "bg-blue-500/10",
      gradient: "from-[#2563EB] to-[#60A5FA]",
      description: "Agendadas para hoy",
    },
    {
      title: "Nuevos Pacientes",
      value: stats.newPatientsThisMonth,
      icon: UserPlus,
      color: "text-purple-500",
      bgLight: "bg-purple-500/10",
      gradient: "from-[#7C3AED] to-[#A78BFA]",
      description: "Añadidos este mes",
    },
    {
      title: "Ingresos Hoy",
      value: new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(stats.revenueToday || 0),
      icon: DollarSign,
      color: "text-green-600",
      bgLight: "bg-green-100",
      gradient: "from-[#059669] to-[#34D399]",
      description: "Generado hoy",
    }
  ]

  return (
    <div className="space-y-6">
      {/* Encabezado destacado */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-panel text-white shadow-elevated px-6 py-7 md:px-8 md:py-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand/20 blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand-light/90 mb-2">Panel de control</p>
            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Resumen de Clínica</h1>
            <p className="text-white/60 text-sm mt-2 max-w-md">
              Aquí está el resumen de tu clínica para hoy, {format(new Date(), "d 'de' MMMM", { locale: es })}.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Button render={<Link href="/admin/patients/new" />} className="bg-white/10 text-white border border-white/15 hover:bg-white/15 hover:shadow-none backdrop-blur-sm rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Crear Paciente
            </Button>
            <Button render={<Link href="/admin/appointments/new" />} className="bg-brand text-white hover:bg-brand-dark rounded-xl shadow-glow">
              <Calendar className="h-4 w-4 mr-2" />
              Nueva Cita
            </Button>
          </div>
        </div>
      </div>

      {/* Tarjeta principal de contenido */}
      <div className="bg-card rounded-2xl shadow-soft border border-border/70 p-5 md:p-7 min-h-[500px]">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted/60 rounded-xl w-fit mb-7 overflow-x-auto">
          {[
            { id: "overview", label: "Visión General" },
            { id: "appointments", label: "Próximas Citas" },
            { id: "notifications", label: "Notificaciones" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-card text-primary shadow-soft"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* KPIs */}
            <div>
              <h2 className="text-sm font-semibold text-slate-800 mb-4">Indicadores Principales</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, i) => (
                  <div
                    key={i}
                    className="group relative overflow-hidden rounded-2xl p-5 border border-border/70 bg-card hover-lift hover:shadow-card hover:border-brand/30"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${stat.gradient} shadow-soft`}>
                        <stat.icon className="h-5 w-5 text-white" />
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-brand transition-colors" />
                    </div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">{stat.title}</p>
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-800 leading-tight mt-0.5">{stat.value}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 mb-2">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-7 w-7 rounded-lg bg-brand-soft flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-brand-dark" />
                  </div>
                  <h2 className="text-sm font-semibold text-slate-800">Ingresos de la Semana (Estimado)</h2>
                </div>
                <div className="h-72 bg-card border border-border/70 rounded-2xl p-4 shadow-soft">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.revenueData || []}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0D9488" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="#2DD4BF" stopOpacity={0.55} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} tickFormatter={(value) => `$${value/1000}k`} />
                      <RechartsTooltip
                        cursor={{fill: 'rgb(13 148 136 / 0.06)'}}
                        contentStyle={{borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 8px 24px -8px rgb(16 36 57 / 0.14)'}}
                        formatter={(value: any) => [`$${value.toLocaleString()}`, 'Ingresos']}
                      />
                      <Bar dataKey="ingresos" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Citas y Accesos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h2 className="text-sm font-semibold text-slate-800 mb-4">Próximas 5 Citas</h2>
                <div className="space-y-3">
                  {upcomingAppointments.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-border rounded-2xl bg-muted/30">
                      <p className="text-muted-foreground text-sm">No hay citas programadas próximamente.</p>
                    </div>
                  ) : (
                    upcomingAppointments.map((apt: any) => (
                      <div key={apt.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border/70 rounded-2xl bg-card hover:border-brand/40 hover:shadow-soft transition-all">
                        <div className="flex items-center gap-4">
                          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-bold text-slate-600 ring-1 ring-inset ring-slate-200/60">
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
                              {formatAppointmentDate(apt.scheduled_at)}
                            </p>
                            <p className="text-xs text-muted-foreground">{apt.duration_minutes} min</p>
                          </div>
                          <Button variant="ghost" size="sm" render={<Link href={`/admin/appointments/${apt.id}`} />} className="text-brand hover:text-brand-dark">
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
                  <Link href="/admin/patients/new" className="flex items-center gap-3 p-3.5 border border-border/70 rounded-2xl bg-card hover:border-brand/40 hover:shadow-soft transition-all group">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#0D9488] to-[#2DD4BF] flex items-center justify-center text-white shadow-soft">
                      <UserPlus className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-brand-dark transition-colors">Crear Paciente</p>
                      <p className="text-xs text-muted-foreground">Añadir nueva ficha médica</p>
                    </div>
                  </Link>

                  <Link href="/admin/loyalty" className="flex items-center gap-3 p-3.5 border border-border/70 rounded-2xl bg-card hover:border-brand/40 hover:shadow-soft transition-all group">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] flex items-center justify-center text-white shadow-soft">
                      <Star className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-brand-dark transition-colors">Otorgar Puntos</p>
                      <p className="text-xs text-muted-foreground">Programa de fidelidad</p>
                    </div>
                  </Link>

                  <Link href="/admin/settings" className="flex items-center gap-3 p-3.5 border border-border/70 rounded-2xl bg-card hover:border-brand/40 hover:shadow-soft transition-all group">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-400 flex items-center justify-center text-white shadow-soft">
                      <Settings className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-brand-dark transition-colors">Configuración</p>
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
              <h2 className="text-sm font-semibold text-slate-800">Próximas Citas</h2>
              <Button variant="outline" size="sm" render={<Link href="/admin/appointments" />}>Ver Calendario Completo</Button>
            </div>
            <div className="space-y-3">
              {upcomingAppointments.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-muted/30">
                  <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No hay citas próximas</p>
                </div>
              ) : (
                upcomingAppointments.map((apt: any) => (
                  <div key={apt.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border/70 rounded-2xl bg-card hover:border-brand/40 hover:shadow-soft transition-all">
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-bold text-slate-600 ring-1 ring-inset ring-slate-200/60">
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
                          {formatAppointmentDate(apt.scheduled_at)}
                        </p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand-soft text-brand-dark">
                          {apt.status}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" render={<Link href={`/admin/appointments/${apt.id}`} />} className="text-brand hover:text-brand-dark">
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
            <div className="p-16 text-center border border-dashed border-border rounded-2xl bg-muted/30">
              <div className="h-14 w-14 bg-card rounded-2xl flex items-center justify-center shadow-soft border border-border/70 mx-auto mb-4">
                <Star className="h-6 w-6 text-brand" />
              </div>
              <h3 className="text-slate-800 font-semibold mb-1">Sin notificaciones nuevas</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Todo está al día. Aquí aparecerán alertas sobre cancelaciones, stock o actualizaciones del sistema.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
