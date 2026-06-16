import { PatientForm } from "@/components/admin/patients/PatientForm"
import { PageHeader } from "@/components/admin/PageHeader"
import { UserPlus } from "lucide-react"

export default function NewPatientPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuevo Paciente"
        description="Ingresa los datos para registrar un nuevo paciente en la clínica."
        icon={UserPlus}
      />

      <div className="rounded-2xl border border-border/70 bg-card shadow-soft p-6 md:p-7">
        <PatientForm />
      </div>
    </div>
  )
}
