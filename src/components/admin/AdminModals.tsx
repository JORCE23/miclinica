"use client"

import { createContext, useCallback, useContext, useState, type ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { format } from "date-fns"
import { X } from "lucide-react"
import { AppointmentForm } from "@/components/admin/appointments/AppointmentForm"
import { PatientForm } from "@/components/admin/patients/PatientForm"
import { ProfessionalForm } from "@/components/admin/professionals/ProfessionalForm"
import { useCreateAppointment } from "@/hooks/useAppointments"

export type AppointmentPrefill = {
  patient_id?: string
  service_id?: string
  professional_id?: string
  scheduled_at?: string // ISO
  duration_minutes?: number
  price?: number
}

type Ctx = {
  openAppointment: (prefill?: AppointmentPrefill) => void
  openPatient: (defaults?: Record<string, unknown>) => void
  openProfessional: () => void
}

const ModalsContext = createContext<Ctx>({
  openAppointment: () => {},
  openPatient: () => {},
  openProfessional: () => {},
})

export const useAdminModals = () => useContext(ModalsContext)

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-2xl my-4 bg-card rounded-2xl shadow-elevated border border-border/70" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card rounded-t-2xl z-10">
          <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
          <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

export function AdminModalsProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  const createAppointment = useCreateAppointment()
  const [appt, setAppt] = useState<AppointmentPrefill | null>(null)
  const [patientDefaults, setPatientDefaults] = useState<Record<string, unknown> | null>(null)
  const [profOpen, setProfOpen] = useState(false)

  const openAppointment = useCallback((prefill: AppointmentPrefill = {}) => setAppt(prefill), [])
  const openPatient = useCallback((defaults?: Record<string, unknown>) => setPatientDefaults(defaults || {}), [])
  const openProfessional = useCallback(() => setProfOpen(true), [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const submitAppointment = async (data: any) => {
    try {
      await createAppointment.mutateAsync(data)
      toast.success("Cita agendada")
      qc.invalidateQueries({ queryKey: ["appointments"] })
      setAppt(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al agendar")
    }
  }

  const apptScheduled = appt?.scheduled_at ? format(new Date(appt.scheduled_at), "yyyy-MM-dd'T'HH:mm") : undefined

  return (
    <ModalsContext.Provider value={{ openAppointment, openPatient, openProfessional }}>
      {children}

      {appt !== null && (
        <Modal title="Nueva Cita" onClose={() => setAppt(null)}>
          <AppointmentForm
            onSubmit={submitAppointment}
            isSubmitting={createAppointment.isPending}
            defaultPatientId={appt.patient_id}
            defaultScheduledAt={apptScheduled}
            defaultServiceId={appt.service_id}
            defaultProfessionalId={appt.professional_id}
            defaultDuration={appt.duration_minutes}
            defaultPrice={appt.price}
          />
        </Modal>
      )}

      {patientDefaults !== null && (
        <Modal title="Nuevo Paciente" onClose={() => setPatientDefaults(null)}>
          <PatientForm
            defaults={patientDefaults}
            onCancel={() => setPatientDefaults(null)}
            onSuccess={() => { qc.invalidateQueries({ queryKey: ["patients"] }); setPatientDefaults(null) }}
          />
        </Modal>
      )}

      {profOpen && (
        <Modal title="Nuevo Profesional" onClose={() => setProfOpen(false)}>
          <ProfessionalForm
            onCancel={() => setProfOpen(false)}
            onSuccess={() => { qc.invalidateQueries({ queryKey: ["professionals"] }); setProfOpen(false) }}
          />
        </Modal>
      )}
    </ModalsContext.Provider>
  )
}
