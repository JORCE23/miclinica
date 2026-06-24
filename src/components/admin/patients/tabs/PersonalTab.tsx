"use client"

import { useState } from "react"
import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

import { patientSchema, type PatientFormValues } from "@/lib/validations/patient"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RutInput } from "@/components/shared/RutInput"
import { Save, User, FileText, AlertTriangle, RotateCcw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function PersonalTab({ patient }: { patient: any }) {
  const [isLoading, setIsLoading] = useState(false)
  const [isReactivating, setIsReactivating] = useState(false)
  const queryClient = useQueryClient()

  async function handleReactivate() {
    setIsReactivating(true)
    try {
      const res = await fetch(`/api/patients/${patient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: patient.full_name,
          rut: patient.rut || "",
          birth_date: patient.birth_date || "",
          phone: patient.phone || "",
          email: patient.email || "",
          notes: patient.notes || "",
          is_active: true,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Error al reactivar")
      }
      toast.success("Paciente reactivado exitosamente")
      queryClient.invalidateQueries({ queryKey: ["patient", patient.id] })
      queryClient.invalidateQueries({ queryKey: ["patients"] })
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsReactivating(false)
    }
  }

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      full_name: patient.full_name || "",
      rut: patient.rut || "",
      birth_date: patient.birth_date ? patient.birth_date.substring(0, 10) : "",
      phone: patient.phone || "",
      email: patient.email || "",
      notes: patient.notes || "",
    },
  })

  // Edad calculada en vivo desde la fecha de nacimiento
  const watchedBirth = useWatch({ control, name: "birth_date" })
  const computeAge = (d?: string) => {
    if (!d) return null
    const b = new Date(d)
    if (isNaN(b.getTime())) return null
    const now = new Date()
    let age = now.getFullYear() - b.getFullYear()
    const m = now.getMonth() - b.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--
    return age >= 0 && age < 130 ? age : null
  }
  const age = computeAge(watchedBirth)

  async function onSubmit(data: PatientFormValues) {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/patients/${patient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Ocurrió un error al actualizar el paciente")
      }

      toast.success("Datos actualizados exitosamente")
      queryClient.invalidateQueries({ queryKey: ["patient", patient.id] })
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/70 shadow-soft">
          <CardHeader className="bg-muted/40 border-b pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-brand" /> Editar Información Básica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre Completo *</Label>
              <Input id="full_name" {...register("full_name")} />
              {errors.full_name && <p className="text-sm text-red-500">{errors.full_name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rut">RUT</Label>
              <Controller
                name="rut"
                control={control}
                render={({ field }) => (
                  <RutInput
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.rut?.message}
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
                {age !== null && (
                  <span className="text-xs font-medium text-brand bg-brand-soft/60 px-2 py-0.5 rounded-full">{age} años</span>
                )}
              </div>
              <Input id="birth_date" type="date" {...register("birth_date")} />
              {errors.birth_date && <p className="text-sm text-red-500">{errors.birth_date.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-soft">
          <CardHeader className="bg-muted/40 border-b pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand" /> Editar Contacto y Notas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico *</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" {...register("phone")} />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas Internas</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                className="h-24 resize-none"
              />
              {errors.notes && <p className="text-sm text-red-500">{errors.notes.message}</p>}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {!patient.is_active && (
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800/50 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Paciente inactivo</p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
              Este paciente fue desactivado. Su historial clínico se conserva íntegro.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReactivate}
            disabled={isReactivating}
            className="border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 shrink-0"
          >
            <RotateCcw className="mr-2 h-3.5 w-3.5" />
            {isReactivating ? "Reactivando..." : "Reactivar"}
          </Button>
        </div>
      )}

      <div className="flex justify-end mt-6">
        <Button type="submit" disabled={isLoading} className="bg-brand text-white hover:bg-brand-dark shadow-glow rounded-xl">
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </form>
  )
}
