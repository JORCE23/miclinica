import { DashboardStats } from "@/components/admin/DashboardStats"
import { LayoutDashboard } from "lucide-react"

export const metadata = {
  title: "Dashboard | Admin",
  description: "Resumen de la clínica",
}

export default function DashboardPage() {
  return (
    <div className="flex-1 max-w-7xl mx-auto w-full pt-4">
      <DashboardStats />
    </div>
  )
}
