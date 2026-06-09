import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Service } from "@/types"

export function useServices(activeOnly: boolean = false) {
  return useQuery<Service[]>({
    queryKey: ["services", activeOnly],
    queryFn: async () => {
      const response = await fetch(`/api/services${activeOnly ? "?activeOnly=true" : ""}`)
      if (!response.ok) {
        throw new Error("Error al obtener los servicios")
      }
      return response.json()
    },
  })
}

export function useCreateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newService: Partial<Service>) => {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newService),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al crear el servicio")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] })
    },
  })
}

export function useUpdateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Service> }) => {
      const response = await fetch(`/api/services/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al actualizar el servicio")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] })
    },
  })
}

export function useDeleteService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/services/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al eliminar el servicio")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] })
    },
  })
}
