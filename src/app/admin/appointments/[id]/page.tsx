"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { AppointmentForm } from "@/components/admin/appointments/AppointmentForm"
import { type AppointmentFormValues } from "@/lib/validations/appointment"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Editar Cita</h1>
        <p className="text-muted-foreground">
          Modifica los detalles de la reserva seleccionada.
        </p>
      </div>

      <div className="border rounded-md p-6 bg-card">
        <AppointmentForm 
          initialData={appointment}
          onSubmit={(data) => updateMutation.mutate(data)} 
          isSubmitting={updateMutation.isPending} 
        />
      </div>
    </div>
  )
}
