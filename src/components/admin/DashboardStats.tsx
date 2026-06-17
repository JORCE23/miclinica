"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Users, Calendar, UserPlus, Settings, Plus, Star, DollarSign, ArrowUpRight, TrendingUp } from "lucide-react"
import { format, isToday, isTomorrow } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"

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

  // Datos para el gráfico de evolución de ingresos
  const revenueData = data.revenueData || []
  const clpFmt = (n: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n || 0)
  const revenueTotal = revenueData.reduce((a: number, d: any) => a + (d.ingresos || 0), 0)
  const revFirst = revenueData.find((d: any) => (d.ingresos || 0) > 0)?.ingresos || 0
  const revLast = [...revenueData].reverse().find((d: any) => (d.ingresos || 0) > 0)?.ingresos || 0
  const revenueTrend = revFirst > 0 ? Math.round(((revLast - revFirst) / revFirst) * 100) : null

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
      tint: "bg-brand/10 text-brand",
      description: "Pacientes activos",
    },
    {
      title: "Citas Hoy",
      value: stats.todayAppointments,
      icon: Calendar,
      tint: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
      description: "Agendadas para hoy",
    },
    {
      title: "Nuevos Pacientes",
      value: stats.newPatientsThisMonth,
      icon: UserPlus,
      tint: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
      description: "Añadidos este mes",
    },
    {
      title: "Ingresos Hoy",
      value: new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(stats.revenueToday || 0),
      icon: DollarSign,
      tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
      description: "Generado hoy",
    }
  ]

  return (
    <div className="space-y-6">
      {/* Encabezado minimalista */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-brand mb-1.5">Panel de control</p>
          <h1 className="font-display text-3xl md:text-[34px] font-semibold tracking-tight text-foreground leading-tight">Resumen de Clínica</h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-md">
            Aquí está el resumen de tu clínica para hoy, {format(new Date(), "d 'de' MMMM", { locale: es })}.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Button variant="outline" render={<Link href="/admin/patients/new" />} className="rounded-xl">
            <Plus className="h-4 w-4 mr-2" />
            Crear Paciente
          </Button>
          <Button render={<Link href="/admin/appointments/new" />} className="bg-brand text-white hover:bg-brand-dark rounded-xl shadow-glow">
            <Calendar className="h-4 w-4 mr-2" />
            Nueva Cita
          </Button>
        </div>
      </div>

      {/* Tarjeta principal de contenido */}
      <div className="bg-card rounded-2xl shadow-soft border border-border/70 p-5 md:p-7 min-h-[500px]">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted/60 rounded-xl w-fit max-w-full mb-7 overflow-x-auto sidebar-scroll">
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
              <h2 className="text-sm font-semibold text-foreground mb-4">Indicadores Principales</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, i) => (
                  <div
                    key={i}
                    className="group relative overflow-hidden rounded-2xl p-5 border border-border/70 bg-card hover-lift hover:shadow-card hover:border-brand/30"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${stat.tint}`}>
                        <stat.icon className="h-5 w-5" />
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-brand transition-colors" />
                    </div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">{stat.title}</p>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground leading-tight mt-0.5">{stat.value}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 mb-2">
                <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-soft">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-semibold text-foreground">Evolución de ingresos</h2>
                        <p className="text-xs text-muted-foreground">Estimado de la semana</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground leading-tight">{clpFmt(revenueTotal)}</p>
                      {revenueTrend !== null && (
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${revenueTrend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                          <ArrowUpRight className={`h-3.5 w-3.5 ${revenueTrend < 0 ? "rotate-90" : ""}`} />
                          {revenueTrend >= 0 ? "+" : ""}{revenueTrend}% en la semana
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                        <defs>
                          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2E7FB0" stopOpacity={0.28} />
                            <stop offset="100%" stopColor="#2E7FB0" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} dy={8} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} width={48} tickFormatter={(v) => `$${v / 1000}k`} />
                        <RechartsTooltip
                          cursor={{ stroke: "#2E7FB0", strokeWidth: 1, strokeDasharray: "4 4" }}
                          contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", boxShadow: "0 8px 24px -8px rgb(16 36 57 / 0.14)", fontSize: "13px" }}
                          labelStyle={{ fontWeight: 600, color: "#162439" }}
                          formatter={(value: any) => [clpFmt(Number(value)), "Ingresos"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="ingresos"
                          stroke="#2E7FB0"
                          strokeWidth={2.5}
                          fill="url(#revFill)"
                          dot={false}
                          activeDot={{ r: 5, fill: "#2E7FB0", stroke: "#fff", strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Citas y Accesos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h2 className="text-sm font-semibold text-foreground mb-4">Próximas 5 Citas</h2>
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
                            <p className="font-semibold text-foreground text-sm">{apt.patient.full_name}</p>
                            <p className="text-xs text-muted-foreground">{apt.service?.name}</p>
                          </div>
                        </div>
                        <div className="mt-2 sm:mt-0 flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-bold text-foreground">
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
                <h2 className="text-sm font-semibold text-foreground mb-4">Accesos Rápidos</h2>
                <div className="space-y-3">
                  <Link href="/admin/patients/new" className="flex items-center gap-3 p-3.5 border border-border/70 rounded-2xl bg-card hover:border-brand/40 hover:shadow-soft transition-all group">
                    <div className="h-10 w-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                      <UserPlus className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground group-hover:text-brand-dark transition-colors">Crear Paciente</p>
                      <p className="text-xs text-muted-foreground">Añadir nueva ficha médica</p>
                    </div>
                  </Link>

                  <Link href="/admin/loyalty" className="flex items-center gap-3 p-3.5 border border-border/70 rounded-2xl bg-card hover:border-brand/40 hover:shadow-soft transition-all group">
                    <div className="h-10 w-10 rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 flex items-center justify-center">
                      <Star className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground group-hover:text-brand-dark transition-colors">Otorgar Puntos</p>
                      <p className="text-xs text-muted-foreground">Programa de fidelidad</p>
                    </div>
                  </Link>

                  <Link href="/admin/settings" className="flex items-center gap-3 p-3.5 border border-border/70 rounded-2xl bg-card hover:border-brand/40 hover:shadow-soft transition-all group">
                    <div className="h-10 w-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
                      <Settings className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground group-hover:text-brand-dark transition-colors">Configuración</p>
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
              <h2 className="text-sm font-semibold text-foreground">Próximas Citas</h2>
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
                        <p className="font-semibold text-foreground text-sm">{apt.patient.full_name}</p>
                        <p className="text-xs text-muted-foreground">{apt.service?.name} • {apt.duration_minutes} minutos</p>
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-0 flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">
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
              <h3 className="text-foreground font-semibold mb-1">Sin notificaciones nuevas</h3>
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
