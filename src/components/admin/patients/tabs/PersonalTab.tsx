"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Calendar, CreditCard, Mail, Phone, FileText } from "lucide-react"

export function PersonalTab({ patient }: { patient: any }) {
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return "N/A"
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-[#7B9AB5]" /> Información Básica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <div className="flex gap-3">
            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <span className="text-sm text-muted-foreground block">Nombre Completo</span>
              <span className="font-medium text-base">{patient.full_name}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <span className="text-sm text-muted-foreground block">RUT</span>
              <span className="font-medium text-base">{patient.rut || "No registrado"}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <span className="text-sm text-muted-foreground block">Fecha de Nacimiento</span>
              <span className="font-medium text-base">
                {patient.birth_date ? format(new Date(patient.birth_date), "dd 'de' MMMM, yyyy", { locale: es }) : "No registrada"} 
                {patient.birth_date && <span className="text-[#162439] font-semibold ml-1">({calculateAge(patient.birth_date)} años)</span>}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#7B9AB5]" /> Contacto y Notas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <div className="flex gap-3">
            <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <span className="text-sm text-muted-foreground block">Correo Electrónico</span>
              <span className="font-medium text-base">{patient.email}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <span className="text-sm text-muted-foreground block">Teléfono</span>
              <span className="font-medium text-base">{patient.phone || "No registrado"}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <span className="text-sm text-muted-foreground block">Canal de origen (Source)</span>
              <span className="font-medium text-base">{patient.source || "No registrado"}</span>
            </div>
          </div>
          <div className="pt-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">Notas Internas</span>
            <p className="text-sm bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 text-amber-900 dark:text-amber-200 p-4 rounded-lg leading-relaxed">
              {patient.notes || "Sin notas adicionales."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
