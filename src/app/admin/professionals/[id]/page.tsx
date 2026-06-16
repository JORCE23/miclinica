"use client"

import { useQuery } from "@tanstack/react-query"
import { ProfessionalForm } from "@/components/admin/professionals/ProfessionalForm"
import { PageHeader } from "@/components/admin/PageHeader"
import { UserCheck } from "lucide-react"

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
      <PageHeader
        title="Editar Profesional"
        description={`Actualiza los datos de ${professional.full_name}`}
        icon={UserCheck}
      />

      <ProfessionalForm initialData={professional} />
    </div>
  )
}
