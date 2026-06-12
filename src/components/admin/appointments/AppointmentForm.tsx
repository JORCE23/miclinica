"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { appointmentSchema, type AppointmentFormValues } from "@/lib/validations/appointment"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { usePatients } from "@/hooks/usePatients"
import { useServices } from "@/hooks/useServices"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEffect } from "react"
import { Appointment } from "@/types"
import { useQuery } from "@tanstack/react-query"

interface AppointmentFormProps {
  initialData?: Appointment
  onSubmit: (data: AppointmentFormValues) => void
  isSubmitting?: boolean
  defaultPatientId?: string
}

import { format } from "date-fns"

export function AppointmentForm({ initialData, onSubmit, isSubmitting, defaultPatientId }: AppointmentFormProps) {
  const { data: patients } = usePatients()
  const { data: services } = useServices(true) // Solo servicios activos
  
  const { data: professionals } = useQuery({
    queryKey: ['professionals'],
    queryFn: async () => {
      const res = await fetch('/api/professionals')
      return res.json()
    }
  })

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const res = await fetch('/api/campaigns')
      return res.json()
    }
  })

  const { register, handleSubmit, formState: { errors }, control, setValue, watch } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patient_id: initialData?.patient_id || defaultPatientId || "",
      service_id: initialData?.service_id || "",
      professional_id: initialData?.professional_id || "",
      campaign_id: initialData?.campaign_id || "",
      scheduled_at: initialData?.scheduled_at ? format(new Date(initialData.scheduled_at), "yyyy-MM-dd'T'HH:mm") : "",
      duration_minutes: initialData?.duration_minutes || 60,
      price: initialData?.price || 0,
      notes: initialData?.notes || "",
      status: initialData?.status || "pendiente",
    },
  })

  const selectedServiceId = watch("service_id")

  // Auto-completar duración y precio cuando cambia el servicio
  useEffect(() => {
    if (selectedServiceId && services) {
      const service = services.find(s => s.id === selectedServiceId)
      if (service && !initialData) {
        setValue("duration_minutes", service.duration_minutes)
        if (service.price != null) {
          setValue("price", service.price)
        }
      }
    }
  }, [selectedServiceId, services, setValue, initialData])

  const handleFormSubmit = (data: AppointmentFormValues) => {
    // Parse local datetime string and convert to UTC ISO string before submitting
    const localDate = new Date(data.scheduled_at)
    onSubmit({
      ...data,
      scheduled_at: localDate.toISOString(),
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="patient_id">Paciente *</Label>
        <Controller
          name="patient_id"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!defaultPatientId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar paciente">
                  {(value: string) => {
                    if (!value) return "Seleccionar paciente"
                    const patient = patients?.find((p) => p.id === value)
                    return patient ? `${patient.full_name} (${patient.rut || patient.email})` : "Seleccionar paciente"
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {patients?.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.full_name} ({patient.rut || patient.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.patient_id && <p className="text-sm text-red-500">{errors.patient_id.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="service_id">Servicio *</Label>
        <Controller
          name="service_id"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar servicio">
                  {(value: string) => {
                     if (!value) return "Seleccionar servicio"
                     const service = services?.find((s) => s.id === value)
                     return service ? `${service.name} (${service.duration_minutes} min)` : "Seleccionar servicio"
                   }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {services?.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} ({service.duration_minutes} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.service_id && <p className="text-sm text-red-500">{errors.service_id.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Profesional</Label>
          <Controller
            name="professional_id"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar profesional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin asignar</SelectItem>
                  {professionals?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name}{p.specialty ? ` — ${p.specialty}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label>Campaña / Origen</Label>
          <Controller
            name="campaign_id"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                <SelectTrigger>
                  <SelectValue placeholder="Orgánico / Sin campaña" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Orgánico / Sin campaña</SelectItem>
                  {campaigns?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="scheduled_at">Fecha y Hora *</Label>
        <Input 
          id="scheduled_at" 
          type="datetime-local" 
          {...register("scheduled_at")} 
        />
        {errors.scheduled_at && <p className="text-sm text-red-500">{errors.scheduled_at.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration_minutes">Duración (min) *</Label>
          <Input 
            id="duration_minutes" 
            type="number" 
            min="5" 
            {...register("duration_minutes")} 
          />
          {errors.duration_minutes && <p className="text-sm text-red-500">{errors.duration_minutes.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Precio ($)</Label>
          <Input 
            id="price" 
            type="number" 
            min="0"
            {...register("price")} 
          />
          {errors.price && <p className="text-sm text-red-500">{errors.price.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas de la Cita</Label>
        <Textarea 
          id="notes" 
          placeholder="Requerimientos especiales, observaciones..." 
          {...register("notes")} 
        />
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSubmitting} className="bg-[#162439] hover:bg-[#1E304D] text-white">
          {isSubmitting ? "Guardando..." : initialData ? "Actualizar Cita" : "Agendar Cita"}
        </Button>
      </div>
    </form>
  )
}
