"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, CheckCircle, XCircle, Clock, CheckCircle2, UserX } from "lucide-react"
import { useUpdateAppointmentStatus } from "@/hooks/useAppointments"
import { toast } from "sonner"
import { useState } from "react"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"

interface AppointmentStatusActionsProps {
  appointmentId: string
  currentStatus: string
  loyaltyPoints?: number
}

export function AppointmentStatusActions({ appointmentId, currentStatus, loyaltyPoints = 0 }: AppointmentStatusActionsProps) {
  const updateStatus = useUpdateAppointmentStatus()
  const [confirmComplete, setConfirmComplete] = useState(false)

  const handleStatusChange = async (newStatus: string, assignPoints: boolean = false) => {
    try {
      await updateStatus.mutateAsync({ id: appointmentId, status: newStatus, assignPoints })
      toast.success(`Estado cambiado a ${newStatus}`)
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
          <span className="sr-only">Abrir menú</span>
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {currentStatus !== "confirmada" && (
            <DropdownMenuItem onClick={() => handleStatusChange("confirmada")} className="text-blue-600">
              <CheckCircle className="mr-2 h-4 w-4" /> Confirmar
            </DropdownMenuItem>
          )}
          
          {currentStatus !== "completada" && (
            <DropdownMenuItem 
              onClick={() => {
                if (loyaltyPoints > 0) {
                  setConfirmComplete(true)
                } else {
                  handleStatusChange("completada")
                }
              }} 
              className="text-emerald-600"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" /> Marcar Completada
            </DropdownMenuItem>
          )}
          
          {currentStatus !== "no_asistio" && (
            <DropdownMenuItem onClick={() => handleStatusChange("no_asistio")} className="text-orange-600">
              <UserX className="mr-2 h-4 w-4" /> No Asistió
            </DropdownMenuItem>
          )}

          {currentStatus !== "cancelada" && (
            <DropdownMenuItem onClick={() => handleStatusChange("cancelada")} className="text-red-600">
              <XCircle className="mr-2 h-4 w-4" /> Cancelar Cita
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmComplete}
        onOpenChange={setConfirmComplete}
        title="Completar Cita"
        description={`Esta cita otorgará ${loyaltyPoints} puntos de fidelidad al paciente. ¿Deseas asignarlos automáticamente ahora?`}
        confirmText="Sí, asignar puntos"
        cancelText="No, solo completar"
        onConfirm={() => handleStatusChange("completada", true)}
        onCancel={() => handleStatusChange("completada", false)}
      />
    </>
  )
}
