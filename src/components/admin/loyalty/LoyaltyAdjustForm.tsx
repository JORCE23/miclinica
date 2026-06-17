"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface LoyaltyAdjustFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientId: string
  patientName: string
}

export function LoyaltyAdjustForm({ open, onOpenChange, patientId, patientName }: LoyaltyAdjustFormProps) {
  const queryClient = useQueryClient()
  const [points, setPoints] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<"sumar" | "restar">("sumar")

  const adjustMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/loyalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Error al ajustar puntos")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty_accounts"] })
      toast.success("Puntos ajustados correctamente")
      onOpenChange(false)
      setPoints("")
      setDescription("")
      setType("sumar")
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!points || isNaN(Number(points))) {
      return toast.error("Ingresa una cantidad válida")
    }
    
    const pointsNumber = type === "sumar" ? Math.abs(Number(points)) : -Math.abs(Number(points))
    
    adjustMutation.mutate({
      patient_id: patientId,
      points: pointsNumber,
      description: description || "Ajuste manual",
      type: "ajuste"
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajustar Puntos</DialogTitle>
          <DialogDescription>
            Paciente: <span className="font-semibold text-foreground dark:text-white">{patientName}</span>
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Operación</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={type} 
                onChange={(e) => setType(e.target.value as "sumar" | "restar")}
              >
                <option value="sumar">Sumar (+)</option>
                <option value="restar">Restar (-)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cantidad</label>
              <Input 
                type="number" 
                min="1" 
                value={points} 
                onChange={(e) => setPoints(e.target.value)} 
                placeholder="Ej. 100" 
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Motivo (Descripción)</label>
            <Textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Ej. Promoción de cumpleaños, error en sistema..." 
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={adjustMutation.isPending}>
              Aplicar Ajuste
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
