import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Phone, Mail, Calendar, CreditCard, HeartPulse, AlertTriangle, Syringe } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export const metadata = {
  title: "Mi Perfil | Clínica Estética",
}

export default async function ClientProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const { data: medicalHistory } = await supabase
    .from("medical_history")
    .select("*")
    .eq("patient_id", user.id)

  const { data: allergies } = await supabase
    .from("allergies")
    .select("*")
    .eq("patient_id", user.id)

  const { data: procedures } = await supabase
    .from("aesthetic_procedures_history")
    .select("*")
    .eq("patient_id", user.id)
    .order("performed_at", { ascending: false })

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return "N/A"
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
          <User className="h-8 w-8 text-rose-500" /> Mi Perfil
        </h1>
        <p className="text-muted-foreground mt-2">
          Revisa tus datos personales y tu historial médico de solo lectura. Si notas un error, comunícate con la clínica.
        </p>
      </div>

      {/* Datos Personales */}
      <Card className="border-rose-100 dark:border-rose-900/30">
        <CardHeader className="bg-rose-50/50 dark:bg-rose-950/20 border-b">
          <CardTitle className="text-lg text-rose-800 dark:text-rose-200">Datos Personales</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2 p-6">
          <div className="flex gap-3">
            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <span className="text-sm text-muted-foreground block">Nombre Completo</span>
              <span className="font-medium text-base">{profile?.full_name}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <span className="text-sm text-muted-foreground block">RUT</span>
              <span className="font-medium text-base">{profile?.rut || "No registrado"}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <span className="text-sm text-muted-foreground block">Fecha de Nacimiento</span>
              <span className="font-medium text-base">
                {profile?.birth_date ? format(new Date(profile.birth_date), "dd/MM/yyyy") : "No registrada"}
                {profile?.birth_date && <span className="text-rose-600 font-semibold ml-1">({calculateAge(profile.birth_date)} años)</span>}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <span className="text-sm text-muted-foreground block">Email</span>
              <span className="font-medium text-base">{profile?.email}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <span className="text-sm text-muted-foreground block">Teléfono</span>
              <span className="font-medium text-base">{profile?.phone || "No registrado"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Antecedentes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-emerald-500" /> Antecedentes Mórbidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!medicalHistory || medicalHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                No tienes antecedentes registrados.
              </p>
            ) : (
              <ul className="space-y-4">
                {medicalHistory.map((item: any) => (
                  <li key={item.id} className="border-b pb-3 last:border-0 last:pb-0">
                    <p className="font-medium text-slate-900 dark:text-white">{item.condition}</p>
                    {item.diagnosed_at && <p className="text-xs text-muted-foreground">Diagnosticado: {format(new Date(item.diagnosed_at), "yyyy")}</p>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Alergias */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> Alergias
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!allergies || allergies.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                No tienes alergias registradas.
              </p>
            ) : (
              <ul className="space-y-3">
                {allergies.map((item: any) => (
                  <li key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border">
                    <span className="font-medium">{item.allergen}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.severity === 'severa' ? 'bg-red-100 text-red-700' :
                      item.severity === 'moderada' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {item.severity}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Procedimientos Previos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Syringe className="h-5 w-5 text-violet-500" /> Procedimientos Estéticos Previos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!procedures || procedures.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6 bg-slate-50 dark:bg-slate-900 rounded-lg">
              No tienes procedimientos estéticos previos registrados en tu historial.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {procedures.map((proc: any) => (
                <div key={proc.id} className="p-4 rounded-xl border bg-card">
                  <p className="font-semibold text-slate-900 dark:text-white mb-1">{proc.procedure_name}</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    {format(new Date(proc.performed_at), "dd 'de' MMMM, yyyy", { locale: es })}
                  </p>
                  {proc.performed_by && (
                    <p className="text-sm"><span className="text-muted-foreground">Realizado por:</span> {proc.performed_by}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
