"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { Plus } from "lucide-react"

export function ProceduresTab({ patientId }: { patientId: string }) {
  const queryClient = useQueryClient()
  const [isAdding, setIsAdding] = useState(false)
  const [procedureName, setProcedureName] = useState("")
  const [performedAt, setPerformedAt] = useState("")
  const [performedBy, setPerformedBy] = useState("")
  const [notes, setNotes] = useState("")

  const { data: procedures, isLoading } = useQuery({
    queryKey: ["procedures", patientId],
    queryFn: async () => {
      const res = await fetch(`/api/patients/${patientId}/procedures`)
      if (!res.ok) throw new Error("Error al cargar procedimientos")
      return res.json()
    }
  })

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/patients/${patientId}/procedures`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Error al agregar procedimiento")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procedures", patientId] })
      setIsAdding(false)
      setProcedureName("")
      setPerformedAt("")
      setPerformedBy("")
      setNotes("")
      toast.success("Procedimiento agregado al historial")
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!procedureName || !performedAt) return toast.error("Nombre y fecha son requeridos")
    addMutation.mutate({ procedure_name: procedureName, performed_at: performedAt, performed_by: performedBy, notes })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Procedimientos Estéticos Previos</h3>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="sm" className="bg-rose-600 hover:bg-rose-700">
            <Plus className="h-4 w-4 mr-2" /> Agregar Procedimiento
          </Button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="p-4 border rounded-md space-y-4 bg-muted/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Procedimiento *</label>
              <Input value={procedureName} onChange={e => setProcedureName(e.target.value)} placeholder="Ej. Ácido Hialurónico Labios" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha Realizado *</label>
              <Input type="date" value={performedAt} onChange={e => setPerformedAt(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Profesional / Clínica</label>
              <Input value={performedBy} onChange={e => setPerformedBy(e.target.value)} placeholder="Dr. Juan, o Clínica Externa" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Notas / Resultados</label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Marca utilizada, dosis, reacción..." />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Cancelar</Button>
            <Button type="submit" disabled={addMutation.isPending}>Guardar</Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-center text-muted-foreground py-8">Cargando procedimientos...</div>
      ) : procedures?.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-md">
          No hay procedimientos estéticos registrados.
        </div>
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Procedimiento</TableHead>
                <TableHead>Profesional/Lugar</TableHead>
                <TableHead>Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {procedures?.map((proc: any) => (
                <TableRow key={proc.id}>
                  <TableCell className="font-medium">
                    {format(new Date(proc.performed_at), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>{proc.procedure_name}</TableCell>
                  <TableCell>{proc.performed_by || "-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate max-w-[300px]">
                    {proc.notes || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
