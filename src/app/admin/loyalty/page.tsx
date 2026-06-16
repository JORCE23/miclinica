import { LoyaltyList } from "@/components/admin/loyalty/LoyaltyList"
import { PageHeader } from "@/components/admin/PageHeader"
import { Award } from "lucide-react"

export const metadata = {
  title: "Puntos de Fidelidad | Admin",
  description: "Gestión global de puntos de fidelidad de pacientes",
}

export default function LoyaltyPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader
        title="Puntos de Fidelidad"
        description="Ranking de pacientes y gestión manual de puntos"
        icon={Award}
      />

      <LoyaltyList />
    </div>
  )
}
