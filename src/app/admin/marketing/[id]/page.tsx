"use client"

import { useQuery } from "@tanstack/react-query"
import { CampaignForm } from "@/components/admin/marketing/CampaignForm"

export default function EditCampaignPage({ params }: { params: { id: string } }) {
  const { data: campaign, isLoading } = useQuery({
    queryKey: ["campaign", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${params.id}`)
      if (!res.ok) throw new Error("Error al cargar la campaña")
      return res.json()
    }
  })

  if (isLoading) return <div className="p-8 text-center text-[#6B7E94]">Cargando datos...</div>
  if (!campaign) return <div className="p-8 text-center text-red-500">Campaña no encontrada</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-semibold text-[#162439]">Editar Campaña</h1>
        <p className="text-[#6B7E94] mt-1">Modificando los detalles de la campaña {campaign.name}</p>
      </div>
      
      <CampaignForm initialData={campaign} />
    </div>
  )
}
