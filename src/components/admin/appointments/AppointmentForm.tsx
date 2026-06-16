"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { appointmentSchema, type AppointmentFormValues } from "@/lib/validations/appointment"
import { validateRut, formatRut } from "@/lib/validations/rut"
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
import { useEffect, useState } from "react"
import { Appointment } from "@/types"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { UserPlus, UserCheck } from "lucide-react"

interface AppointmentFormProps {
  initialData?: Appointment
  onSubmit: (data: AppointmentFormValues) => void
  isSubmitting?: boolean
  defaultPatientId?: string
}

import { format } from "date-fns"

const PRESET_DURATIONS = [15, 30, 45, 60, 90, 120, 150, 180]
const durLabel = (m: number) => {
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const mm = m % 60
  return mm ? `${h} h ${mm} min` : `${h} h`
}

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

  // Modo de paciente: seleccionar existente o crear uno nuevo en el momento
  const [patientMode, setPatientMode] = useState<"existing" | "new">("existing")
  const [creatingPatient, setCreatingPatient] = useState(false)
  const [np, setNp] = useState({ full_name: "", rut: "", phone: "", email: "", birth_date: "" })

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
      professional_id: data.professional_id || null,
      campaign_id: data.campaign_id || null,
      scheduled_at: localDate.toISOString(),
    })
  }

  // Wrapper de envío: si el modo es "nuevo paciente", lo crea primero y luego agenda.
  const onSubmitWrapper = async (e: React.FormEvent) => {
    e.preventDefault()
    if (patientMode === "new" && !defaultPatientId) {
      // Validaciones del paciente nuevo
      const name = np.full_name.trim()
      const email = np.email.trim()
      if (name.length < 2 || !/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s.'-]+$/.test(name)) {
        toast.error("El nombre solo puede contener letras")
        return
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast.error("El correo electrónico no es válido")
        return
      }
      if (!np.rut.trim()) {
        toast.error("El RUT es obligatorio")
        return
      }
      if (!validateRut(np.rut)) {
        toast.error("El RUT no es válido")
        return
      }
      if (np.phone.replace(/\D/g, "").length < 8) {
        toast.error("El teléfono es obligatorio (ingresa un número válido)")
        return
      }
      setCreatingPatient(true)
      try {
        const res = await fetch("/api/patients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: np.full_name.trim(),
            email: np.email.trim(),
            rut: np.rut.trim() || undefined,
            phone: np.phone.trim() || undefined,
            birth_date: np.birth_date || undefined,
            source: "directo",
          }),
        })
        const data = await res.json()
        if (!res.ok || !data?.id) {
          toast.error(data?.error || "No se pudo crear el paciente")
          setCreatingPatient(false)
          return
        }
        setValue("patient_id", data.id, { shouldValidate: true })
        toast.success("Paciente creado")
      } catch {
        toast.error("No se pudo crear el paciente")
        setCreatingPatient(false)
        return
      }
      setCreatingPatient(false)
    }
    handleSubmit(handleFormSubmit)()
  }

  return (
    <form onSubmit={onSubmitWrapper} className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="patient_id">Paciente *</Label>
          {!defaultPatientId && (
            <div className="flex gap-1 bg-muted/60 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setPatientMode("existing")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${patientMode === "existing" ? "bg-card text-brand-dark shadow-soft" : "text-muted-foreground hover:text-foreground"}`}
              >
                <UserCheck className="h-3.5 w-3.5" /> Existente
              </button>
              <button
                type="button"
                onClick={() => setPatientMode("new")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${patientMode === "new" ? "bg-card text-brand-dark shadow-soft" : "text-muted-foreground hover:text-foreground"}`}
              >
                <UserPlus className="h-3.5 w-3.5" /> Nuevo
              </button>
            </div>
          )}
        </div>

        {(patientMode === "existing" || defaultPatientId) ? (
          <>
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
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-border/70 bg-muted/20">
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs">Nombre completo *</Label>
              <Input
                value={np.full_name}
                onChange={(e) => setNp({ ...np, full_name: e.target.value.replace(/[0-9]/g, "") })}
                placeholder="Ej. Camila Rojas"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">RUT *</Label>
              <Input
                value={np.rut}
                onChange={(e) => setNp({ ...np, rut: formatRut(e.target.value) })}
                placeholder="12.345.678-9"
                inputMode="text"
              />
              {np.rut.trim() && !validateRut(np.rut) && (
                <p className="text-[11px] text-red-500">RUT inválido</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Teléfono *</Label>
              <Input
                value={np.phone}
                onChange={(e) => setNp({ ...np, phone: e.target.value.replace(/[^0-9+\s()-]/g, "") })}
                placeholder="+56 9 ..."
                inputMode="tel"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Correo electrónico *</Label>
              <Input
                type="email"
                value={np.email}
                onChange={(e) => setNp({ ...np, email: e.target.value })}
                placeholder="correo@ejemplo.com"
              />
              {np.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(np.email) && (
                <p className="text-[11px] text-red-500">Correo inválido</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Fecha de nacimiento</Label>
              <Input type="date" value={np.birth_date} onChange={(e) => setNp({ ...np, birth_date: e.target.value })} />
            </div>
            <p className="sm:col-span-2 text-[11px] text-muted-foreground">Se creará el paciente y luego se agendará la cita automáticamente.</p>
          </div>
        )}
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
                  <SelectValue placeholder="Seleccionar profesional">
                    {(value: string) => {
                      if (!value) return "Seleccionar profesional"
                      const prof = professionals?.find((p: any) => p.id === value)
                      return prof ? `${prof.full_name}${prof.specialty ? ` — ${prof.specialty}` : ''}` : "Seleccionar profesional"
                    }}
                  </SelectValue>
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
                  <SelectValue placeholder="Orgánico / Sin campaña">
                    {(value: string) => {
                      if (!value) return "Orgánico / Sin campaña"
                      const camp = campaigns?.find((c: any) => c.id === value)
                      return camp ? `${camp.name} (${camp.type || camp.channel})` : "Orgánico / Sin campaña"
                    }}
                  </SelectValue>
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
          step={900}
          {...register("scheduled_at")}
        />
        {errors.scheduled_at && <p className="text-sm text-red-500">{errors.scheduled_at.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration_minutes">Duración *</Label>
          <select
            id="duration_minutes"
            {...register("duration_minutes")}
            className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none transition-all focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/15"
          >
            {Array.from(new Set([...PRESET_DURATIONS, Number(watch("duration_minutes")) || 60]))
              .filter((m) => m > 0)
              .sort((a, b) => a - b)
              .map((m) => (
                <option key={m} value={m}>{durLabel(m)}</option>
              ))}
          </select>
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
        <Button type="submit" disabled={isSubmitting || creatingPatient} className="bg-brand text-white hover:bg-brand-dark shadow-glow rounded-xl">
          {creatingPatient ? "Creando paciente..." : isSubmitting ? "Guardando..." : initialData ? "Actualizar Cita" : "Agendar Cita"}
        </Button>
      </div>
    </form>
  )
}
