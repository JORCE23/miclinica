"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { campaignSchema, CampaignFormValues } from "@/lib/validations/campaign"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Campaign } from "@/types"

interface CampaignFormProps {
  initialData?: Campaign
}

export function CampaignForm({ initialData }: CampaignFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const isEditing = !!initialData

  const { register, handleSubmit, formState: { errors }, control } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: initialData ? {
      ...initialData,
      start_date: initialData.start_date ? new Date(initialData.start_date).toISOString().split('T')[0] : "",
      end_date: initialData.end_date ? new Date(initialData.end_date).toISOString().split('T')[0] : "",
      budget: initialData.budget || undefined,
      spent: initialData.spent || undefined,
      reach: initialData.reach || undefined,
      conversions: initialData.conversions || undefined,
    } : {
      name: "",
      type: "email",
      status: "draft",
      description: "",
      start_date: "",
      end_date: "",
    } as any
  })

  const mutation = useMutation({
    mutationFn: async (data: CampaignFormValues) => {
      const url = isEditing ? `/api/campaigns/${initialData.id}` : '/api/campaigns'
      const method = isEditing ? 'PUT' : 'POST'
      
      const payload = {
        ...data,
        start_date: data.start_date ? new Date(data.start_date).toISOString() : null,
        end_date: data.end_date ? new Date(data.end_date).toISOString() : null,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (!res.ok) throw new Error('Error al guardar la campaña')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success(isEditing ? "Campaña actualizada" : "Campaña creada")
      router.push('/admin/marketing')
    },
    onError: () => {
      toast.error("Ocurrió un error al guardar")
    }
  })

  const onSubmit = (data: CampaignFormValues) => {
    mutation.mutate(data)
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-card shadow-soft p-6 md:p-7 max-w-3xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Nombre de Campaña *</Label>
            <Input {...register("name")} placeholder="Ej. Promo Verano" />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Estado</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="active">Activa</SelectItem>
                    <SelectItem value="paused">Pausada</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Fecha Inicio</Label>
            <Input type="date" {...register("start_date")} />
          </div>
          <div className="space-y-2">
            <Label>Fecha Fin</Label>
            <Input type="date" {...register("end_date")} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <Label>Presupuesto</Label>
            <Input type="number" {...register("budget")} />
          </div>
          <div className="space-y-2">
            <Label>Gastado</Label>
            <Input type="number" {...register("spent")} />
          </div>
          <div className="space-y-2">
            <Label>Alcance</Label>
            <Input type="number" {...register("reach")} />
          </div>
          <div className="space-y-2">
            <Label>Conversiones</Label>
            <Input type="number" {...register("conversions")} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Descripción / Notas</Label>
          <Textarea {...register("description")} placeholder="Objetivo de la campaña..." />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={() => router.push('/admin/marketing')}>
            Cancelar
          </Button>
          <Button type="submit" className="bg-brand text-white hover:bg-brand-dark shadow-glow rounded-xl" disabled={mutation.isPending}>
            {mutation.isPending ? "Guardando..." : "Guardar Campaña"}
          </Button>
        </div>
      </form>
    </div>
  )
}
