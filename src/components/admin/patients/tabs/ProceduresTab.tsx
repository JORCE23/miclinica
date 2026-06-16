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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { toast } from "sonner"
import { Plus, Image as ImageIcon, Loader2, Activity } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { FacialDiagram, type DiagramPoint } from "./FacialDiagram"

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
  const [diagramPoints, setDiagramPoints] = useState<DiagramPoint[]>([])
  const [showDiagram, setShowDiagram] = useState(false)

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
      setDiagramPoints([])
      setShowDiagram(false)
      toast.success("Procedimiento agregado al historial")
    }
  })

  const uploadImage = async (file: File, prefix: string) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${patientId}/${Date.now()}_${prefix}.${fileExt}`
    
    const { error } = await supabase.storage
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
        after_image_url: afterUrl,
        facial_diagram_data: diagramPoints.length > 0 ? diagramPoints : null
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
          <Button onClick={() => setIsAdding(true)} size="sm" className="bg-brand text-white hover:bg-brand-dark shadow-glow rounded-xl">
            <Plus className="h-4 w-4 mr-2" /> Agregar Procedimiento
          </Button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="p-4 border border-border/70 rounded-2xl space-y-6 bg-muted/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Procedimiento *</label>
              <Input value={procedureName} onChange={e => setProcedureName(e.target.value)} placeholder="Ej. Ácido Hialurónico Labios" disabled={isUploading} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Fecha Realizado *</label>
              <Input type="date" value={performedAt} onChange={e => setPerformedAt(e.target.value)} disabled={isUploading} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Profesional / Clínica</label>
              <Input value={performedBy} onChange={e => setPerformedBy(e.target.value)} placeholder="Dr. Juan, o Clínica Externa" disabled={isUploading} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Foto &quot;Antes&quot; (Opcional)</label>
              <Input type="file" accept="image/*" onChange={e => setBeforeFile(e.target.files?.[0] || null)} disabled={isUploading} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Foto &quot;Después&quot; (Opcional)</label>
              <Input type="file" accept="image/*" onChange={e => setAfterFile(e.target.files?.[0] || null)} disabled={isUploading} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Esquema Facial Interactivo</label>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowDiagram(!showDiagram)}>
                {showDiagram ? "Ocultar Esquema" : "Mostrar Esquema"}
              </Button>
            </div>
            {showDiagram && (
              <FacialDiagram points={diagramPoints} onChange={setDiagramPoints} disabled={isUploading} />
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notas / Resultados</label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Marca utilizada, dosis, reacción..." disabled={isUploading} />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} disabled={isUploading}>Cancelar</Button>
            <Button type="submit" disabled={addMutation.isPending || isUploading} className="bg-brand text-white hover:bg-brand-dark shadow-glow rounded-xl">
              {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : "Guardar Procedimiento"}
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-center text-muted-foreground py-8">Cargando procedimientos...</div>
      ) : procedures?.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-2xl">
          No hay procedimientos estéticos registrados.
        </div>
      ) : (
        <div className="relative w-full overflow-x-auto rounded-2xl border border-border/70 bg-card">
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
                        <Dialog>
                          <DialogTrigger render={
                            <button className="text-xs flex items-center text-blue-600 hover:underline cursor-pointer bg-transparent border-0 p-0">
                              <ImageIcon className="h-3 w-3 mr-1" /> Antes
                            </button>
                          } />
                          <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[90vw] md:max-w-4xl border-none bg-transparent shadow-none p-0">
                            <div className="relative flex justify-center items-center w-full h-full max-h-[90vh]">
                              <img src={proc.before_image_url} alt="Antes" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : <span className="text-xs text-muted-foreground">-</span>}
                      {proc.after_image_url && (
                        <Dialog>
                          <DialogTrigger render={
                            <button className="text-xs flex items-center text-blue-600 hover:underline cursor-pointer bg-transparent border-0 p-0">
                              <ImageIcon className="h-3 w-3 mr-1" /> Después
                            </button>
                          } />
                          <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[90vw] md:max-w-4xl border-none bg-transparent shadow-none p-0">
                            <div className="relative flex justify-center items-center w-full h-full max-h-[90vh]">
                              <img src={proc.after_image_url} alt="Después" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      {proc.facial_diagram_data && (
                        <Dialog>
                          <DialogTrigger render={<Button variant="link" className="h-auto p-0 text-xs text-indigo-600 h-4" />}>
                              <Activity className="h-3 w-3 mr-1" /> Mapa Facial
                          </DialogTrigger>
                          <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[90vw] md:max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Esquema Facial del Tratamiento</DialogTitle>
                            </DialogHeader>
                            <div className="mt-4">
                              <FacialDiagram points={proc.facial_diagram_data} onChange={() => {}} disabled />
                            </div>
                          </DialogContent>
                        </Dialog>
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

