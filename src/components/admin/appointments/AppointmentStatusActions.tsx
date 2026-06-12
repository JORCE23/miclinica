"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, CheckCircle, XCircle, Clock, CheckCircle2, UserX } from "lucide-react"
import { useUpdateAppointmentStatus, useDeleteAppointment } from "@/hooks/useAppointments"
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
  const deleteAppointment = useDeleteAppointment()
  const [confirmComplete, setConfirmComplete] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleStatusChange = async (newStatus: string, assignPoints: boolean = false) => {
    try {
      await updateStatus.mutateAsync({ id: appointmentId, status: newStatus, assignPoints })
      toast.success(`Estado cambiado a ${newStatus}`)
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteAppointment.mutateAsync(appointmentId)
      toast.success("Cita eliminada exitosamente")
      setConfirmDelete(false)
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-foreground h-8 w-8 p-0">
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

          <DropdownMenuItem onClick={() => setConfirmDelete(true)} className="text-red-700 font-medium">
            <XCircle className="mr-2 h-4 w-4" /> Eliminar (Borrar)
          </DropdownMenuItem>
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

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Eliminar Cita"
        description="¿Estás seguro de que deseas eliminar esta cita de forma permanente? Esta acción no se puede deshacer."
        confirmText="Eliminar permanentemente"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        isDanger={true}
      />
    </>
  )
}
