import { LoyaltyList } from "@/components/admin/loyalty/LoyaltyList"
import { Award } from "lucide-react"

export const metadata = {
  title: "Puntos de Fidelidad | Admin",
  description: "Gestión global de puntos de fidelidad de pacientes",
}

export default function LoyaltyPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center">
            <Award className="mr-3 h-8 w-8 text-amber-500" />
            Puntos de Fidelidad
          </h2>
          <p className="text-muted-foreground">
            Ranking de pacientes y gestión manual de puntos
          </p>
        </div>
      </div>
      
      <LoyaltyList />
    </div>
  )
}
