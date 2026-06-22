import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Award, CalendarClock, ChevronRight } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export const metadata = {
  title: "Mi Panel | Clínica Estética",
}

export default async function ClientDashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single()

  // Puntos
  const { data: loyalty } = await supabase
    .from("loyalty_accounts")
    .select("total_points")
    .eq("patient_id", user.id)
    .single()

  // Próxima cita
  const { data: nextAppointments } = await supabase
    .from("appointments")
    .select("id, scheduled_at, status, duration_minutes, service:services!service_id(name)")
    .eq("patient_id", user.id)
    .gte("scheduled_at", new Date().toISOString())
    .in("status", ["pendiente", "confirmada"])
    .order("scheduled_at", { ascending: true })
    .limit(1)

  const nextApt = nextAppointments?.[0]

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          ¡Hola, {profile?.full_name?.split(' ')[0] || "Bienvenido"}! 👋
        </h1>
        <p className="text-muted-foreground mt-2">
          Bienvenido a tu portal de paciente. Aquí puedes ver tu historial, puntos y próximas citas.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Card Puntos */}
        <Card className="border-rose-100 bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-950/20 dark:to-orange-950/20 overflow-hidden relative">
          <div className="absolute right-0 top-0 opacity-10 translate-x-1/4 -translate-y-1/4 pointer-events-none">
            <Award className="w-48 h-48" />
          </div>
          <CardHeader>
            <CardTitle className="text-[#162439] dark:text-rose-400 flex items-center gap-2">
              <Award className="h-5 w-5" /> Tus Puntos Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-slate-900 dark:text-white">
                {loyalty?.total_points || 0}
              </span>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">pts</span>
            </div>
            
            <div className="mt-6">
              <Link href="/client/loyalty" className="text-sm font-medium text-[#162439] hover:text-rose-700 flex items-center gap-1 transition-colors">
                Ver historial de puntos <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Card Próxima Cita */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-sky-500" /> Tu Próxima Cita
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextApt ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col gap-1 mb-3">
                    <span className="text-sm font-medium text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                      {format(new Date(nextApt.scheduled_at), "EEEE, d 'de' MMMM", { locale: es })}
                    </span>
                    <span className="text-2xl font-bold">
                      {format(new Date(nextApt.scheduled_at), "HH:mm")} hrs
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-900 dark:text-white block">
                      {(nextApt.service as any)?.name}
                    </span>
                    <span className="text-sm text-muted-foreground block mt-1">
                      Duración aprox: {nextApt.duration_minutes} min
                    </span>
                  </div>
                </div>
                <div>
                  <Link href="/client/appointments" className="text-sm font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1 transition-colors">
                    Ver todas mis citas <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col justify-center py-4">
                <p className="text-muted-foreground mb-4">No tienes citas programadas próximamente.</p>
                <Link href="/client/appointments" className="text-sm font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1 transition-colors">
                  Ir a Mis Citas <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
