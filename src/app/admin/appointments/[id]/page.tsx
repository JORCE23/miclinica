"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { AppointmentForm } from "@/components/admin/appointments/AppointmentForm"
import { type AppointmentFormValues } from "@/lib/validations/appointment"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/admin/PageHeader"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Calendar, FileText } from "lucide-react"
import Link from "next/link"

export default function EditAppointmentPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: appointment, isLoading, error } = useQuery({
    queryKey: ["appointment", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/appointments/${params.id}`)
      if (!res.ok) throw new Error("Error al cargar la cita")
      return res.json()
    }
  })

  const updateMutation = useMutation({
    mutationFn: async (data: AppointmentFormValues) => {
      const res = await fetch(`/api/appointments/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Error al actualizar cita")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
      toast.success("Cita actualizada exitosamente")
      router.push("/admin/appointments")
    },
    onError: (error: any) => {
      toast.error(error.message)
    }
  })

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando detalles de la cita...</div>
  }

  if (error || !appointment) {
    return (
      <div className="p-8 text-center text-red-500">
        Error al cargar la cita: {error?.message || "No encontrada"}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Editar Cita"
        description="Modifica los detalles de la reserva seleccionada."
        icon={Calendar}
      >
        {appointment.patient_id && (
          <Button
            render={<Link href={`/admin/patients/${appointment.patient_id}`} />}
            className="bg-brand text-white hover:bg-brand-dark rounded-xl shadow-glow"
          >
            <FileText className="h-4 w-4 mr-2" /> Ir a ficha clínica
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-muted-foreground hover:bg-muted hover:text-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </PageHeader>

      <div className="rounded-2xl border border-border/70 bg-card shadow-soft p-4 md:p-7">
        <AppointmentForm 
          initialData={appointment}
          onSubmit={(data) => updateMutation.mutate(data)} 
          isSubmitting={updateMutation.isPending} 
        />
      </div>
    </div>
  )
}
