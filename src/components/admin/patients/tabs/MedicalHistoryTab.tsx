"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { Plus } from "lucide-react"

export function MedicalHistoryTab({ patientId }: { patientId: string }) {
  const queryClient = useQueryClient()
  const [isAdding, setIsAdding] = useState(false)
  const [condition, setCondition] = useState("")
  const [diagnosedAt, setDiagnosedAt] = useState("")
  const [notes, setNotes] = useState("")

  const { data: history, isLoading } = useQuery({
    queryKey: ["medical_history", patientId],
    queryFn: async () => {
      const res = await fetch(`/api/patients/${patientId}/medical-history`)
      if (!res.ok) throw new Error("Error al cargar historial")
      return res.json()
    }
  })

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/patients/${patientId}/medical-history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Error al agregar condición")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medical_history", patientId] })
      setIsAdding(false)
      setCondition("")
      setDiagnosedAt("")
      setNotes("")
      toast.success("Condición agregada")
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!condition) return toast.error("La condición es requerida")
    addMutation.mutate({ condition, diagnosed_at: diagnosedAt, notes })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Antecedentes Mórbidos</h3>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="sm" className="bg-[#162439] hover:bg-[#1E304D] text-white">
            <Plus className="h-4 w-4 mr-2" /> Agregar Condición
          </Button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="p-4 border rounded-md space-y-4 bg-muted/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Condición / Enfermedad *</label>
              <Input value={condition} onChange={e => setCondition(e.target.value)} placeholder="Ej. Hipertensión" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha de Diagnóstico</label>
              <Input type="date" value={diagnosedAt} onChange={e => setDiagnosedAt(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Notas Adicionales</label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Tratamiento actual, observaciones..." />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Cancelar</Button>
            <Button type="submit" disabled={addMutation.isPending}>Guardar</Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-center text-muted-foreground py-8">Cargando historial...</div>
      ) : history?.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-md">
          No hay antecedentes registrados para este paciente.
        </div>
      ) : (
        <div className="relative border-l border-muted ml-3 space-y-8 py-4">
          {history?.map((item: any) => (
            <div key={item.id} className="relative pl-6">
              <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-[#162439] ring-4 ring-background" />
              <div className="flex flex-col space-y-1">
                <span className="font-medium text-lg">{item.condition}</span>
                <span className="text-sm text-muted-foreground">
                  {item.diagnosed_at ? format(new Date(item.diagnosed_at), "MMMM yyyy", { locale: es }) : "Fecha desconocida"}
                </span>
                {item.notes && <p className="text-sm mt-2 text-slate-700 dark:text-slate-300 bg-muted/50 p-2 rounded">{item.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

