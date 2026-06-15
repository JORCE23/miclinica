"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

import { patientSchema, type PatientFormValues } from "@/lib/validations/patient"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RutInput } from "@/components/shared/RutInput"
import { Save, User, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function PersonalTab({ patient }: { patient: any }) {
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()

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
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-[#7B9AB5]" /> Editar Información Básica
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
              <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
              <Input id="birth_date" type="date" {...register("birth_date")} />
              {errors.birth_date && <p className="text-sm text-red-500">{errors.birth_date.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#7B9AB5]" /> Editar Contacto y Notas
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
      
      <div className="flex justify-end mt-6">
        <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </form>
  )
}
