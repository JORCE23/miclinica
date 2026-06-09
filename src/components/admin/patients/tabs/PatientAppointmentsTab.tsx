"use client"

import { AppointmentList } from "../../appointments/AppointmentList"

export function PatientAppointmentsTab({ patientId }: { patientId: string }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Historial de Citas</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Todas las citas agendadas para este paciente.
      </p>
      
      <AppointmentList patientId={patientId} />
    </div>
  )
}
