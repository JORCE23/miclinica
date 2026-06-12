import { ProfessionalForm } from "@/components/admin/professionals/ProfessionalForm"

export default function NewProfessionalPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-semibold text-[#162439]">Nuevo Profesional</h1>
        <p className="text-[#6B7E94] mt-1">Ingresa los datos del nuevo integrante de tu equipo</p>
      </div>
      
      <ProfessionalForm />
    </div>
  )
}
