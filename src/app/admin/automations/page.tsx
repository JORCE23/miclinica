import { AutomationsView } from "@/components/admin/automations/AutomationsView"

export default function AutomationsPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-semibold text-[#162439]">Automatizaciones</h1>
        <p className="text-[#6B7E94] mt-1">Configura recordatorios y mensajes automáticos para tus pacientes</p>
      </div>
      
      <AutomationsView />
    </div>
  )
}
