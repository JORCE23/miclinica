import { ProfessionalList } from "@/components/admin/professionals/ProfessionalList"
import { PageHeader } from "@/components/admin/PageHeader"
import { UserCheck } from "lucide-react"

export default function ProfessionalsPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Equipo"
        description="Gestiona los profesionales y staff médico de tu clínica"
        icon={UserCheck}
      />

      <ProfessionalList />
    </div>
  )
}
