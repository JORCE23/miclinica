import { useQuery } from "@tanstack/react-query"
import { Profile } from "@/types"

export function usePatients() {
  return useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const response = await fetch("/api/patients")
      if (!response.ok) {
        throw new Error("Error fetching patients")
      }
      return response.json() as Promise<Profile[]>
    },
  })
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: ["patients", id],
    queryFn: async () => {
      const response = await fetch(`/api/patients/${id}`)
      if (!response.ok) {
        throw new Error("Error fetching patient")
      }
      return response.json() as Promise<Profile>
    },
    enabled: !!id,
  })
}
