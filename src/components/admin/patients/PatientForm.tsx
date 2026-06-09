"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { patientSchema, type PatientFormValues } from "@/lib/validations/patient"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RutInput } from "@/components/shared/RutInput"

export function PatientForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      full_name: "",
      rut: "",
      birth_date: "",
      phone: "",
      email: "",
      password: "",
      notes: "",
    },
  })

  async function onSubmit(data: PatientFormValues) {
    setIsLoading(true)

    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Ocurrió un error al crear el paciente")
      }

      toast.success("Paciente creado exitosamente")
      router.push(`/admin/patients/${result.id}`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="full_name">Nombre Completo *</Label>
          <Input id="full_name" placeholder="Ej. Juan Pérez" {...register("full_name")} />
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
          <Label htmlFor="email">Correo Electrónico *</Label>
          <Input id="email" type="email" placeholder="correo@ejemplo.com" {...register("email")} />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" placeholder="+56912345678" {...register("phone")} />
          {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
          <Input id="birth_date" type="date" {...register("birth_date")} />
          {errors.birth_date && <p className="text-sm text-red-500">{errors.birth_date.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña Provisional</Label>
          <Input id="password" type="password" placeholder="Mínimo 6 caracteres" {...register("password")} />
          {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas Internas</Label>
        <Textarea id="notes" placeholder="Información adicional relevante..." {...register("notes")} className="h-24" />
        {errors.notes && <p className="text-sm text-red-500">{errors.notes.message}</p>}
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/patients")}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Guardando..." : "Guardar Paciente"}
        </Button>
      </div>
    </form>
  )
}
