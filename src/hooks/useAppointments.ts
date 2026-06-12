import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Appointment } from "@/types"

export function useAppointments(filters?: { status?: string; patient_id?: string; date?: string }) {
  return useQuery<Appointment[]>({
    queryKey: ["appointments", filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.status) params.append("status", filters.status)
      if (filters?.patient_id) params.append("patient_id", filters.patient_id)
      if (filters?.date) params.append("date", filters.date)
      
      const response = await fetch(`/api/appointments?${params.toString()}`)
      if (!response.ok) throw new Error("Error al obtener citas")
      return response.json()
    },
  })
}

export function useCreateAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<Appointment>) => {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al crear cita")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
    },
  })
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Appointment> }) => {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al actualizar cita")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
    },
  })
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status, assignPoints = false }: { id: string; status: string; assignPoints?: boolean }) => {
      const response = await fetch(`/api/appointments/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, assignPoints }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al cambiar estado")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
    },
  })
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al eliminar cita")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
    },
  })
}
