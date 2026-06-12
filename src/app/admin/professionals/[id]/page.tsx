"use client"

import { useQuery } from "@tanstack/react-query"
import { ProfessionalForm } from "@/components/admin/professionals/ProfessionalForm"

export default function EditProfessionalPage({ params }: { params: { id: string } }) {
  const { data: professional, isLoading } = useQuery({
    queryKey: ["professional", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/professionals/${params.id}`)
      if (!res.ok) throw new Error("Error al cargar profesional")
      return res.json()
    }
  })

  if (isLoading) return <div className="p-8 text-center text-[#6B7E94]">Cargando datos...</div>
  if (!professional) return <div className="p-8 text-center text-red-500">Profesional no encontrado</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-semibold text-[#162439]">Editar Profesional</h1>
        <p className="text-[#6B7E94] mt-1">Actualiza los datos de {professional.full_name}</p>
      </div>
      
      <ProfessionalForm initialData={professional} />
    </div>
  )
}
