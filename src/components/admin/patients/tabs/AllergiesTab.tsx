"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Plus } from "lucide-react"

export function AllergiesTab({ patientId }: { patientId: string }) {
  const queryClient = useQueryClient()
  const [isAdding, setIsAdding] = useState(false)
  const [allergen, setAllergen] = useState("")
  const [severity, setSeverity] = useState("leve")
  const [reaction, setReaction] = useState("")

  const { data: allergies, isLoading } = useQuery({
    queryKey: ["allergies", patientId],
    queryFn: async () => {
      const res = await fetch(`/api/patients/${patientId}/allergies`)
      if (!res.ok) throw new Error("Error al cargar alergias")
      return res.json()
    }
  })

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/patients/${patientId}/allergies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Error al agregar alergia")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allergies", patientId] })
      setIsAdding(false)
      setAllergen("")
      setSeverity("leve")
      setReaction("")
      toast.success("Alergia agregada")
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!allergen) return toast.error("El alérgeno es requerido")
    addMutation.mutate({ allergen, severity, reaction })
  }

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "leve": return <Badge className="bg-emerald-500 hover:bg-emerald-600">Leve</Badge>
      case "moderada": return <Badge className="bg-orange-500 hover:bg-orange-600">Moderada</Badge>
      case "severa": return <Badge className="bg-red-600 hover:bg-red-700">⚠️ Severa</Badge>
      default: return <Badge>{sev}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Alergias Conocidas</h3>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="sm" className="bg-[#162439] hover:bg-[#1E304D] text-white">
            <Plus className="h-4 w-4 mr-2" /> Agregar Alergia
          </Button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="p-4 border rounded-md space-y-4 bg-muted/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Alérgeno *</label>
              <Input value={allergen} onChange={e => setAllergen(e.target.value)} placeholder="Ej. Penicilina, Látex..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Severidad</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={severity} 
                onChange={e => setSeverity(e.target.value)}
              >
                <option value="leve">Leve</option>
                <option value="moderada">Moderada</option>
                <option value="severa">Severa</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reacción Observada</label>
            <Textarea value={reaction} onChange={e => setReaction(e.target.value)} placeholder="Erupciones, dificultad para respirar..." />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Cancelar</Button>
            <Button type="submit" disabled={addMutation.isPending}>Guardar</Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-center text-muted-foreground py-8">Cargando alergias...</div>
      ) : allergies?.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-md">
          No hay alergias registradas para este paciente.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {allergies?.map((item: any) => (
            <div key={item.id} className="border p-4 rounded-lg shadow-sm bg-card flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-lg">{item.allergen}</span>
                  {getSeverityBadge(item.severity)}
                </div>
                {item.reaction && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                    {item.reaction}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

