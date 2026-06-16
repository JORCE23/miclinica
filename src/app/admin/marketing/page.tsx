import { CampaignList } from "@/components/admin/marketing/CampaignList"
import { PageHeader } from "@/components/admin/PageHeader"
import { Megaphone } from "lucide-react"

export default function MarketingPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Marketing"
        description="Gestiona tus campañas de marketing para adquirir y fidelizar pacientes"
        icon={Megaphone}
      />

      <CampaignList />
    </div>
  )
}
