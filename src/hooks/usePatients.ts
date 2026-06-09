import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { Profile } from "@/types"

export function usePatients() {
  return useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "client")
        .order("created_at", { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      return data as Profile[]
    },
  })
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: ["patients", id],
    queryFn: async () => {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data as Profile
    },
    enabled: !!id,
  })
}
