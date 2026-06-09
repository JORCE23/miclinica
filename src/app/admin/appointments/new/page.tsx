"use client"

import { AppointmentForm } from "@/components/admin/appointments/AppointmentForm"
import { useCreateAppointment } from "@/hooks/useAppointments"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export default function NewAppointmentPage() {
  const router = useRouter()
  const createAppointment = useCreateAppointment()

  const handleSubmit = async (data: any) => {
    try {
      await createAppointment.mutateAsync(data)
      toast.success("Cita agendada exitosamente")
      router.push("/admin/appointments")
    } catch (error: any) {
      toast.error(error.message || "Error al agendar cita")
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Nueva Cita</h1>
          <p className="text-muted-foreground">
            Agenda una nueva reserva para un paciente.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalles de la Cita</CardTitle>
          <CardDescription>
            Selecciona el paciente, el servicio y la fecha para la reserva.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppointmentForm 
            onSubmit={handleSubmit}
            isSubmitting={createAppointment.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
