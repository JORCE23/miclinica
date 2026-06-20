import { Badge } from "@/components/ui/badge"
import { AppointmentStatus } from "@/types"

export function StatusBadge({ status }: { status: AppointmentStatus | string }) {
  const getStatusProps = () => {
    switch (status) {
      case "pendiente":
        return { label: "Pendiente", className: "bg-slate-500 hover:bg-slate-600" }
      case "confirmada":
        return { label: "Confirmada", className: "bg-slate-500 hover:bg-slate-600" }
      case "completada":
        return { label: "Completada", className: "bg-emerald-500 hover:bg-emerald-600" }
      case "cancelada":
        return { label: "Cancelada", className: "bg-red-500 hover:bg-red-600" }
      case "no_asistio":
        return { label: "No Asistió", className: "bg-orange-500 hover:bg-orange-600" }
      default:
        return { label: status, className: "bg-slate-500" }
    }
  }

  const { label, className } = getStatusProps()

  return (
    <Badge className={className}>
      {label}
    </Badge>
  )
}
