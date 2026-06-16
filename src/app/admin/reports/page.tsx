import { ReportsView } from "@/components/admin/reports/ReportsView"
import { PageHeader } from "@/components/admin/PageHeader"
import { BarChart3 } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Reportes y Estadísticas"
        description="Análisis detallado del rendimiento de tu clínica"
        icon={BarChart3}
      />

      <ReportsView />
    </div>
  )
}
