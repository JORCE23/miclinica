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
import { toast } from "sonner"
import { Plus, Image as ImageIcon, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export function ProceduresTab({ patientId }: { patientId: string }) {
  const queryClient = useQueryClient()
  const supabase = createClient()
  const [isAdding, setIsAdding] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  
  const [procedureName, setProcedureName] = useState("")
  const [performedAt, setPerformedAt] = useState("")
  const [performedBy, setPerformedBy] = useState("")
  const [notes, setNotes] = useState("")
  const [beforeFile, setBeforeFile] = useState<File | null>(null)
  const [afterFile, setAfterFile] = useState<File | null>(null)

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
      setBeforeFile(null)
      setAfterFile(null)
      toast.success("Procedimiento agregado al historial")
    }
  })

  const uploadImage = async (file: File, prefix: string) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${patientId}/${Date.now()}_${prefix}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from('clinical_photos')
      .upload(fileName, file)

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('clinical_photos')
      .getPublicUrl(fileName)

    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!procedureName || !performedAt) return toast.error("Nombre y fecha son requeridos")
    
    setIsUploading(true)
    try {
      let beforeUrl = null
      let afterUrl = null

      if (beforeFile) {
        beforeUrl = await uploadImage(beforeFile, 'before')
      }
      if (afterFile) {
        afterUrl = await uploadImage(afterFile, 'after')
      }

      addMutation.mutate({ 
        procedure_name: procedureName, 
        performed_at: performedAt, 
        performed_by: performedBy, 
        notes,
        before_image_url: beforeUrl,
        after_image_url: afterUrl
      })
    } catch (error: any) {
      toast.error("Error al subir las imágenes: " + error.message)
    } finally {
      setIsUploading(false)
    }
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
              <Input value={procedureName} onChange={e => setProcedureName(e.target.value)} placeholder="Ej. Ácido Hialurónico Labios" disabled={isUploading} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha Realizado *</label>
              <Input type="date" value={performedAt} onChange={e => setPerformedAt(e.target.value)} disabled={isUploading} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Profesional / Clínica</label>
              <Input value={performedBy} onChange={e => setPerformedBy(e.target.value)} placeholder="Dr. Juan, o Clínica Externa" disabled={isUploading} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Foto "Antes" (Opcional)</label>
              <Input type="file" accept="image/*" onChange={e => setBeforeFile(e.target.files?.[0] || null)} disabled={isUploading} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Foto "Después" (Opcional)</label>
              <Input type="file" accept="image/*" onChange={e => setAfterFile(e.target.files?.[0] || null)} disabled={isUploading} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notas / Resultados</label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Marca utilizada, dosis, reacción..." disabled={isUploading} />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsAdding(false)} disabled={isUploading}>Cancelar</Button>
            <Button type="submit" disabled={addMutation.isPending || isUploading}>
              {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo...</> : "Guardar"}
            </Button>
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
        <div className="relative w-full overflow-x-auto rounded-md border bg-card">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Procedimiento</TableHead>
                <TableHead>Profesional</TableHead>
                <TableHead>Fotos</TableHead>
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
                  <TableCell>
                    <div className="flex gap-2">
                      {proc.before_image_url ? (
                        <a href={proc.before_image_url} target="_blank" rel="noreferrer" className="text-xs flex items-center text-blue-600 hover:underline">
                          <ImageIcon className="h-3 w-3 mr-1" /> Antes
                        </a>
                      ) : <span className="text-xs text-muted-foreground">-</span>}
                      {proc.after_image_url && (
                        <a href={proc.after_image_url} target="_blank" rel="noreferrer" className="text-xs flex items-center text-blue-600 hover:underline">
                          <ImageIcon className="h-3 w-3 mr-1" /> Después
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">
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
