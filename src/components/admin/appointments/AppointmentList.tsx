"use client"

import { useAppointments } from "@/hooks/useAppointments"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { AppointmentStatusActions } from "./AppointmentStatusActions"

export function AppointmentList({ patientId }: { patientId?: string }) {
  const { data: appointments, isLoading } = useAppointments({ patient_id: patientId })

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando citas...</div>
  }

  if (!appointments || appointments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <h3 className="mb-2 text-lg font-medium">No hay citas registradas</h3>
        <p className="text-sm text-muted-foreground">
          No se encontraron reservas con los filtros actuales.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha y Hora</TableHead>
            {!patientId && <TableHead>Paciente</TableHead>}
            <TableHead>Servicio</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.map((apt) => (
            <TableRow key={apt.id}>
              <TableCell>
                <div className="font-medium capitalize">
                  {format(new Date(apt.scheduled_at), "EEEE d 'de' MMMM", { locale: es })}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(apt.scheduled_at), "HH:mm")} ({apt.duration_minutes} min)
                </div>
              </TableCell>
              
              {!patientId && (
                <TableCell>
                  <div className="font-medium">{apt.patient?.full_name}</div>
                  <div className="text-xs text-muted-foreground">{apt.patient?.rut || apt.patient?.email}</div>
                </TableCell>
              )}
              
              <TableCell>
                <div className="font-medium">{apt.service?.name || "Servicio Personalizado"}</div>
                {apt.price != null && (
                  <div className="text-xs text-muted-foreground">${apt.price.toLocaleString("es-CL")}</div>
                )}
              </TableCell>

              <TableCell>
                <StatusBadge status={apt.status} />
              </TableCell>

              <TableCell className="text-right">
                <AppointmentStatusActions 
                  appointmentId={apt.id} 
                  currentStatus={apt.status}
                  loyaltyPoints={apt.service?.loyalty_points_earned} 
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
