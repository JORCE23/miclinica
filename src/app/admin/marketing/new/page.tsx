import { CampaignForm } from "@/components/admin/marketing/CampaignForm"

export default function NewCampaignPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-semibold text-[#162439]">Nueva Campaña</h1>
        <p className="text-[#6B7E94] mt-1">Crea una nueva campaña de marketing</p>
      </div>
      
      <CampaignForm />
    </div>
  )
}
