"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, CheckCircle, XCircle, CheckCircle2, UserX } from "lucide-react"
import { useUpdateAppointmentStatus, useDeleteAppointment } from "@/hooks/useAppointments"
import { toast } from "sonner"
import { useState } from "react"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

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
  const [paymentMethod, setPaymentMethod] = useState("tarjeta")
  const [assignPoints, setAssignPoints] = useState(true)

  const handleStatusChange = async (newStatus: string, assignPts: boolean = false, payMethod?: string) => {
    try {
      await updateStatus.mutateAsync({ id: appointmentId, status: newStatus, assignPoints: assignPts, paymentMethod: payMethod })
      toast.success(`Estado cambiado a ${newStatus}`)
      setConfirmComplete(false)
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
                setConfirmComplete(true)
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

      <Dialog open={confirmComplete} onOpenChange={setConfirmComplete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Completar Cita</DialogTitle>
            <DialogDescription>
              Por favor, indica el método de pago utilizado por el paciente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label>Método de Pago</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v || "tarjeta")}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar método de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loyaltyPoints > 0 && (
              <div className="flex items-start space-x-2 p-3 bg-primary/5 rounded-md border border-primary/20">
                <input 
                  type="checkbox"
                  id="assignPoints" 
                  checked={assignPoints} 
                  onChange={(e) => setAssignPoints(e.target.checked)} 
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="assignPoints" className="text-sm font-medium leading-none cursor-pointer">
                    Otorgar Puntos de Fidelidad
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Esta cita sumará {loyaltyPoints} puntos al paciente automáticamente.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-end">
            <Button variant="outline" onClick={() => setConfirmComplete(false)}>
              Cancelar
            </Button>
            <Button onClick={() => handleStatusChange("completada", assignPoints, paymentMethod)}>
              Completar y Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
