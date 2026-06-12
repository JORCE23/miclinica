import { ProfessionalList } from "@/components/admin/professionals/ProfessionalList"

export default function ProfessionalsPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-semibold text-[#162439]">Equipo</h1>
        <p className="text-[#6B7E94] mt-1">Gestiona los profesionales y staff médico de tu clínica</p>
      </div>
      
      <ProfessionalList />
    </div>
  )
}
