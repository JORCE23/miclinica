import { CampaignForm } from "@/components/admin/marketing/CampaignForm"
import { PageHeader } from "@/components/admin/PageHeader"
import { Megaphone } from "lucide-react"

export default function NewCampaignPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Nueva Campaña"
        description="Crea una nueva campaña de marketing"
        icon={Megaphone}
      />

      <CampaignForm />
    </div>
  )
}
