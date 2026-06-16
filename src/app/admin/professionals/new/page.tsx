import { ProfessionalForm } from "@/components/admin/professionals/ProfessionalForm"
import { PageHeader } from "@/components/admin/PageHeader"
import { UserCheck } from "lucide-react"

export default function NewProfessionalPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Nuevo Profesional"
        description="Ingresa los datos del nuevo integrante de tu equipo"
        icon={UserCheck}
      />

      <ProfessionalForm />
    </div>
  )
}
