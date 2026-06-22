"use client"

import { useForm, Controller } from "react-hook-form"
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
import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { AvatarUpload } from "@/components/shared/AvatarUpload"

interface ProfessionalFormProps {
  initialData?: Professional
  onSuccess?: () => void
  onCancel?: () => void
}

export function ProfessionalForm({ initialData, onSuccess, onCancel }: ProfessionalFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const isEditing = !!initialData

  const { register, handleSubmit, formState: { errors }, watch, control } = useForm<ProfessionalFormValues>({
    resolver: zodResolver(professionalSchema),
    defaultValues: initialData || {
      is_active: true,
      full_name: "",
      specialty: "",
      email: "",
      phone: ""
    }
  })

  const [avatarUrl, setAvatarUrl] = useState<string>(initialData?.avatar_url || "")
  const [createAccount, setCreateAccount] = useState(false)
  const [password, setPassword] = useState("")
  const [permissions, setPermissions] = useState({
    can_view_dashboard: false,
    can_manage_patients: true,
    can_manage_appointments: true,
    can_manage_services: false,
    can_view_reports: false
  })

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const url = data.createAccount 
        ? '/api/professionals/create-account'
        : (isEditing ? `/api/professionals/${initialData.id}` : '/api/professionals')
      
      const method = isEditing && !data.createAccount ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Error al guardar el profesional')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] })
      toast.success(isEditing ? "Profesional actualizado" : "Profesional creado")
      if (onSuccess) onSuccess()
      else router.push('/admin/professionals')
    },
    onError: () => {
      toast.error("Ocurrió un error al guardar")
    }
  })

  const onSubmit = (data: ProfessionalFormValues) => {
    const payload = { ...data, avatar_url: avatarUrl || null }
    if (!isEditing && createAccount) {
      if (!data.email) return toast.error("Se requiere un Email para crear la cuenta")
      if (!password) return toast.error("Se requiere una Contraseña")

      mutation.mutate({ ...payload, createAccount: true, password, permissions })
    } else {
      mutation.mutate(payload)
    }
  }

  watch("is_active")

  return (
    <div className="rounded-2xl border border-border/70 bg-card shadow-soft p-4 md:p-7 max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <Label className="mb-3 block">Foto del profesional</Label>
          <AvatarUpload value={avatarUrl} onChange={setAvatarUrl} name={watch("full_name")} folder="team" />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre Completo *</Label>
            <Input {...register("full_name")} placeholder="Ej. Dra. María Pérez" />
            {errors.full_name && <p className="text-sm text-red-500">{errors.full_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Especialidad</Label>
            <Input {...register("specialty")} placeholder="Ej. Médico Estético" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input {...register("email")} type="email" placeholder="correo@ejemplo.com" />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input {...register("phone")} placeholder="+56 9 1234 5678" />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Controller
              control={control}
              name="is_active"
              render={({ field }) => (
                <Switch 
                  checked={!!field.value} 
                  onCheckedChange={(checked) => field.onChange(checked)} 
                />
              )}
            />
            <Label>Profesional Activo</Label>
          </div>

          {!isEditing && (
            <div className="pt-4 border-t border-border space-y-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={createAccount} 
                  onCheckedChange={setCreateAccount} 
                />
                <Label className="font-semibold text-foreground">Crear cuenta de acceso al sistema</Label>
              </div>

              {createAccount && (
                <div className="bg-slate-50 p-4 rounded-lg space-y-4 border border-slate-200">
                  <div className="space-y-2">
                    <Label>Contraseña de Acceso *</Label>
                    <Input 
                      type="text" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Asigna una contraseña inicial"
                      className="bg-white"
                    />
                  </div>
                  
                  <div className="space-y-3 pt-2">
                    <Label>Permisos del Usuario</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="p_dashboard" checked={permissions.can_view_dashboard} onCheckedChange={(c) => setPermissions({...permissions, can_view_dashboard: !!c})} />
                        <Label htmlFor="p_dashboard" className="font-normal text-sm">Ver Dashboard de Ingresos</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="p_patients" checked={permissions.can_manage_patients} onCheckedChange={(c) => setPermissions({...permissions, can_manage_patients: !!c})} />
                        <Label htmlFor="p_patients" className="font-normal text-sm">Gestionar Pacientes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="p_appointments" checked={permissions.can_manage_appointments} onCheckedChange={(c) => setPermissions({...permissions, can_manage_appointments: !!c})} />
                        <Label htmlFor="p_appointments" className="font-normal text-sm">Gestionar Agenda y Citas</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="p_services" checked={permissions.can_manage_services} onCheckedChange={(c) => setPermissions({...permissions, can_manage_services: !!c})} />
                        <Label htmlFor="p_services" className="font-normal text-sm">Gestionar Catálogo de Servicios</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="p_reports" checked={permissions.can_view_reports} onCheckedChange={(c) => setPermissions({...permissions, can_view_reports: !!c})} />
                        <Label htmlFor="p_reports" className="font-normal text-sm">Exportar y Ver Reportes</Label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={() => (onCancel ? onCancel() : router.push('/admin/professionals'))}>
            Cancelar
          </Button>
          <Button type="submit" className="bg-brand text-white hover:bg-brand-dark shadow-glow rounded-xl" disabled={mutation.isPending}>
            {mutation.isPending ? "Guardando..." : "Guardar Profesional"}
          </Button>
        </div>
      </form>
    </div>
  )
}
