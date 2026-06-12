"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { professionalSchema, ProfessionalFormValues } from "@/lib/validations/professional"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Professional } from "@/types"

interface ProfessionalFormProps {
  initialData?: Professional
}

export function ProfessionalForm({ initialData }: ProfessionalFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const isEditing = !!initialData

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<ProfessionalFormValues>({
    resolver: zodResolver(professionalSchema),
    defaultValues: initialData || {
      is_active: true,
      full_name: "",
      specialty: "",
      email: "",
      phone: ""
    }
  })

  const mutation = useMutation({
    mutationFn: async (data: ProfessionalFormValues) => {
      const url = isEditing ? `/api/professionals/${initialData.id}` : '/api/professionals'
      const method = isEditing ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!res.ok) throw new Error('Error al guardar el profesional')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] })
      toast.success(isEditing ? "Profesional actualizado" : "Profesional creado")
      router.push('/admin/professionals')
    },
    onError: () => {
      toast.error("Ocurrió un error al guardar")
    }
  })

  const onSubmit = (data: ProfessionalFormValues) => {
    mutation.mutate(data)
  }

  const isActive = watch("is_active")

  return (
    <div className="bg-white p-6 rounded-xl border border-[#D8E2ED] shadow-sm max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre Completo *</Label>
            <Input {...register("full_name")} placeholder="Ej. Dra. María Pérez" className="border-[#D8E2ED] focus-visible:ring-[#162439]" />
            {errors.full_name && <p className="text-sm text-red-500">{errors.full_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Especialidad</Label>
            <Input {...register("specialty")} placeholder="Ej. Médico Estético" className="border-[#D8E2ED] focus-visible:ring-[#162439]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input {...register("email")} type="email" placeholder="correo@ejemplo.com" className="border-[#D8E2ED] focus-visible:ring-[#162439]" />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input {...register("phone")} placeholder="+56 9 1234 5678" className="border-[#D8E2ED] focus-visible:ring-[#162439]" />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Switch 
              checked={isActive} 
              onCheckedChange={(val) => setValue("is_active", val)} 
            />
            <Label>Profesional Activo</Label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#D8E2ED]">
          <Button type="button" variant="outline" onClick={() => router.push('/admin/professionals')}>
            Cancelar
          </Button>
          <Button type="submit" className="bg-[#162439] hover:bg-[#1E304D] text-white" disabled={mutation.isPending}>
            {mutation.isPending ? "Guardando..." : "Guardar Profesional"}
          </Button>
        </div>
      </form>
    </div>
  )
}
