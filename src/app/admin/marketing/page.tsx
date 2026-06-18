import { CampaignList } from "@/components/admin/marketing/CampaignList"
import { PageHeader } from "@/components/admin/PageHeader"
import { Megaphone, Palette } from "lucide-react"

export default function MarketingPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Marketing"
        description="Gestiona tus campañas de marketing para adquirir y fidelizar pacientes"
        icon={Megaphone}
      >
        <a
          href="https://www.canva.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 h-9 px-3.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Palette className="h-4 w-4 text-brand" /> Abrir Canva
        </a>
      </PageHeader>

      <CampaignList />
    </div>
  )
}
