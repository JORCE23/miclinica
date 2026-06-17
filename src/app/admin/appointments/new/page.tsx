"use client"

import { AppointmentForm } from "@/components/admin/appointments/AppointmentForm"
import { useCreateAppointment } from "@/hooks/useAppointments"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Calendar } from "lucide-react"
import { Suspense } from "react"
import { PageHeader } from "@/components/admin/PageHeader"

function NewAppointmentForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const createAppointment = useCreateAppointment()
  
  const defaultPatientId = searchParams.get("patientId") || undefined
  const defaultScheduledAt = searchParams.get("scheduled_at") || undefined

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
      <PageHeader
        title="Nueva Cita"
        description="Agenda una nueva reserva para un paciente."
        icon={Calendar}
      >
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white hover:bg-white/10 hover:text-white">
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </PageHeader>

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
            defaultPatientId={defaultPatientId}
            defaultScheduledAt={defaultScheduledAt}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default function NewAppointmentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Cargando...</div>}>
      <NewAppointmentForm />
    </Suspense>
  )
}
