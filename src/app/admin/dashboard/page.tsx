import { DashboardStats } from "@/components/admin/DashboardStats"
import { LayoutDashboard } from "lucide-react"

export const metadata = {
  title: "Dashboard | Admin",
  description: "Resumen de la clínica",
}

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center">
            <LayoutDashboard className="mr-3 h-8 w-8 text-sky-500" />
            Dashboard
          </h2>
          <p className="text-muted-foreground">
            Resumen en tiempo real de tu clínica
          </p>
        </div>
      </div>
      
      <DashboardStats />
    </div>
  )
}
