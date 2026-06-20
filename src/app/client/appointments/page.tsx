import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { StatusBadge } from "@/components/shared/StatusBadge"

export const metadata = {
  title: "Mis Citas | Clínica Estética",
}

export default async function ClientAppointmentsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: appointments } = await supabase
    .from("appointments")
    .select(`
      id, scheduled_at, status, duration_minutes, notes,
      service:services!service_id(name)
    `)
    .eq("patient_id", user.id)
    .order("scheduled_at", { ascending: false })

  const now = new Date()
  const upcoming = appointments?.filter(a => new Date(a.scheduled_at) >= now && a.status !== 'cancelada') || []
  const past = appointments?.filter(a => new Date(a.scheduled_at) < now || a.status === 'cancelada') || []

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
          <CalendarIcon className="h-8 w-8 text-slate-500" /> Mis Citas
        </h1>
        <p className="text-muted-foreground mt-2">
          Revisa el historial y estado de todas tus reservas en la clínica.
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold border-b pb-2">Próximas Citas</h2>
        {upcoming.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-900 border border-dashed rounded-xl p-8 text-center text-muted-foreground">
            No tienes citas agendadas próximamente.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map((apt: any) => (
              <Card key={apt.id} className="border-slate-100 dark:border-slate-900/30 bg-slate-50/30 dark:bg-slate-950/10">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg text-slate-900 dark:text-white">
                      {apt.service?.name}
                    </CardTitle>
                    <StatusBadge status={apt.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 mb-2">
                    <CalendarIcon className="h-4 w-4" />
                    <span className="font-medium capitalize">
                      {format(new Date(apt.scheduled_at), "EEEE, d 'de' MMMM yyyy", { locale: es })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Clock className="h-4 w-4" />
                    <span>{format(new Date(apt.scheduled_at), "HH:mm")} hrs ({apt.duration_minutes} min)</span>
                  </div>
                  {apt.notes && (
                    <div className="mt-4 text-sm bg-white dark:bg-slate-950 p-3 rounded-md border text-muted-foreground">
                      <strong>Nota:</strong> {apt.notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6 pt-8">
        <h2 className="text-xl font-semibold border-b pb-2">Historial Pasado</h2>
        {past.length === 0 ? (
          <p className="text-muted-foreground">No tienes citas pasadas en tu historial.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {past.map((apt: any) => (
              <Card key={apt.id} className="bg-slate-50 dark:bg-slate-900/50">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-slate-900 dark:text-white line-clamp-1">
                      {apt.service?.name}
                    </h3>
                    <StatusBadge status={apt.status} />
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>{format(new Date(apt.scheduled_at), "dd/MM/yyyy")}</p>
                    <p>{format(new Date(apt.scheduled_at), "HH:mm")} hrs</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
