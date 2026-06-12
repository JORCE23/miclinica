import { ReportsView } from "@/components/admin/reports/ReportsView"

export default function ReportsPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-semibold text-[#162439]">Reportes y Estadísticas</h1>
        <p className="text-[#6B7E94] mt-1">Análisis detallado del rendimiento de tu clínica</p>
      </div>
      
      <ReportsView />
    </div>
  )
}
