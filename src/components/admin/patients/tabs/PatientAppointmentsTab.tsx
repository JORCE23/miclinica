"use client"

import { AppointmentList } from "../../appointments/AppointmentList"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export function PatientAppointmentsTab({ patientId }: { patientId: string }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Historial de Citas</h3>
          <p className="text-sm text-muted-foreground">
            Todas las citas agendadas para este paciente.
          </p>
        </div>
        <Button render={<Link href={`/admin/appointments/new?patientId=${patientId}`} />} className="bg-rose-600 hover:bg-rose-700">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Cita
        </Button>
      </div>
      
      <AppointmentList patientId={patientId} />
    </div>
  )
}
