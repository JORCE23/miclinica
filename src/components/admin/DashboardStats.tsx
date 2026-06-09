"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, CalendarDays, UserPlus, Award, Clock } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export function DashboardStats() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard_stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard")
      if (!res.ok) throw new Error("Error loading dashboard data")
      return res.json()
    }
  })

  if (isLoading) {
    return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="h-32 bg-slate-100 dark:bg-slate-800 border-none"></Card>
      ))}
    </div>
  }

  if (!data) return null

  const stats = data.stats
  const upcomingAppointments = data.upcomingAppointments

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.activePatients}</div>
            <p className="text-xs text-muted-foreground mt-1">Total registrados</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citas Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground mt-1">Agendadas para hoy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos 7 días</CardTitle>
            <CalendarDays className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{stats.next7DaysAppointments}</div>
            <p className="text-xs text-muted-foreground mt-1">Citas confirmadas/pendientes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nuevos Pacientes</CardTitle>
            <UserPlus className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.newPatientsThisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Puntos Otorgados</CardTitle>
            <Award className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pointsGrantedThisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">Este mes</p>
          </CardContent>
        </Card>
      </div>

      {/* Próximas Citas Hoy */}
      <Card className="col-span-3 border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-500" /> Próximas Citas (Hoy)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No hay más citas programadas para el resto del día.</p>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((apt: any) => (
                <div key={apt.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600">
                      {apt.patient.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{apt.patient.full_name}</p>
                      <p className="text-sm text-muted-foreground">{apt.service?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {format(new Date(apt.scheduled_at), "HH:mm")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {apt.duration_minutes} min
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
