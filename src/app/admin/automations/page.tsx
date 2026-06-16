import { AutomationsView } from "@/components/admin/automations/AutomationsView"
import { PageHeader } from "@/components/admin/PageHeader"
import { Zap } from "lucide-react"

export default function AutomationsPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Automatizaciones"
        description="Configura recordatorios y mensajes automáticos para tus pacientes"
        icon={Zap}
      />

      <AutomationsView />
    </div>
  )
}
