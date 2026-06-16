"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft, Pencil, Calendar, Bell, ShieldAlert, ShieldCheck, HeartPulse,
  CalendarDays, Phone, Activity, Mail, IdCard, FileSignature, ClipboardList,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PersonalTab } from "@/components/admin/patients/tabs/PersonalTab"
import { MedicalHistoryTab } from "@/components/admin/patients/tabs/MedicalHistoryTab"
import { AllergiesTab } from "@/components/admin/patients/tabs/AllergiesTab"
import { ProceduresTab } from "@/components/admin/patients/tabs/ProceduresTab"
import { PatientAppointmentsTab } from "@/components/admin/patients/tabs/PatientAppointmentsTab"
import { LoyaltyTab } from "@/components/admin/patients/tabs/LoyaltyTab"
import { ConsentsTab } from "@/components/admin/patients/tabs/ConsentsTab"
import { ClinicalRecordTab } from "@/components/admin/patients/tabs/ClinicalRecordTab"

const TABS = [
  { value: "ficha", label: "Ficha Clínica", icon: ClipboardList },
  { value: "clinical", label: "Procedimientos", icon: Activity },
  { value: "medical", label: "Antecedentes", icon: HeartPulse },
  { value: "appointments", label: "Atenciones", icon: Calendar },
  { value: "consents", label: "Consentimientos", icon: FileSignature },
  { value: "administrative", label: "Datos", icon: IdCard },
  { value: "loyalty", label: "Fidelidad", icon: ShieldCheck },
]

function calculateAge(birthDate?: string) {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("ficha")

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", params.id],
    queryFn: async () => {
      const response = await fetch(`/api/patients/${params.id}`)
      if (!response.ok) throw new Error("Error al cargar paciente")
      return response.json()
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allergies = [] } = useQuery<any[]>({
    queryKey: ["allergies", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/patients/${params.id}/allergies`)
      return res.ok ? res.json() : []
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: medicalHistory = [] } = useQuery<any[]>({
    queryKey: ["medical-history", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/patients/${params.id}/medical-history`)
      return res.ok ? res.json() : []
    },
  })

  if (isLoading) return <div className="p-8 text-center text-slate-500">Cargando expediente clínico...</div>
  if (!patient) return <div className="p-8 text-center text-red-500 font-bold">Paciente no encontrado</div>

  const age = calculateAge(patient.birth_date)
  const stats = [
    { icon: CalendarDays, label: "Edad", value: age != null ? `${age} años` : "—" },
    { icon: Phone, label: "Teléfono", value: patient.phone || "—" },
    { icon: Mail, label: "Email", value: patient.email || "—" },
    { icon: Activity, label: "Estado", value: patient.is_active ? "Activo" : "Inactivo" },
  ]

  return (
    <div className="pb-10 space-y-5">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full block space-y-5">
        {/* 1. ENCABEZADO full-width */}
        <div className="relative overflow-hidden rounded-2xl bg-brand-panel text-white shadow-elevated">
          <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" />
          <div className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-brand/20 blur-3xl" />
          <div className="relative z-10 px-5 md:px-8 pt-5 md:pt-7">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white hover:bg-white/15 rounded-full h-9 w-9 shrink-0">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-gradient-to-br from-white to-slate-200 text-[#162439] flex items-center justify-center text-2xl md:text-3xl font-bold shadow-md shrink-0">
                  {patient.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight truncate">{patient.full_name}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-sm text-white/70">
                    <span className="inline-flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded-lg"><IdCard className="h-3.5 w-3.5" /> {patient.rut || "Sin RUT"}</span>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg ${patient.is_active ? "bg-emerald-400/20 text-emerald-200" : "bg-white/10 text-white/60"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${patient.is_active ? "bg-emerald-400" : "bg-white/40"}`} /> {patient.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 shrink-0">
                <Button onClick={() => setActiveTab("administrative")} className="bg-white/10 text-white border border-white/15 hover:bg-white/15 rounded-xl backdrop-blur-sm">
                  <Pencil className="h-4 w-4 mr-2" /> Editar datos
                </Button>
                <Button render={<Link href="/admin/appointments/new" />} className="bg-brand text-white hover:bg-brand-dark rounded-xl shadow-glow">
                  <Calendar className="h-4 w-4 mr-2" /> Agendar cita
                </Button>
              </div>
            </div>

            {/* Chips de datos rápidos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-5">
              {stats.map((s, i) => (
                <div key={i} className="flex items-center gap-2.5 rounded-xl glass-panel px-3 py-2">
                  <s.icon className="h-4 w-4 text-brand-light shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-white/45 font-semibold">{s.label}</p>
                    <p className="text-sm text-white/90 truncate">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Navegación por secciones */}
            <TabsList className="bg-transparent h-auto p-0 gap-1 flex w-full max-w-full justify-start border-none overflow-x-auto mt-5 [&>button]:shrink-0">
              {TABS.map((t) => (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="group/tab flex items-center gap-2 text-white/60 hover:text-white data-[state=active]:text-white data-[state=active]:bg-white/[0.07] data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-brand-light rounded-t-lg rounded-b-none px-4 py-2.5 font-medium text-sm transition-all whitespace-nowrap"
                >
                  <t.icon className="h-4 w-4" /> {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        {/* 2. RESUMEN CLÍNICO (full-width, en orden) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Notas internas */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-amber-800 mb-2">
              <Bell className="h-4 w-4" />
              <h3 className="font-semibold text-sm">Notas internas</h3>
            </div>
            <p className="text-sm text-amber-900/80 leading-relaxed">
              {patient.notes || "Sin notas internas registradas."}
            </p>
          </div>

          {/* Alergias (alerta de seguridad) */}
          <div className={`rounded-2xl border p-4 ${allergies.length ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}>
            <div className={`flex items-center gap-2 mb-2 ${allergies.length ? "text-red-700" : "text-emerald-700"}`}>
              {allergies.length ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              <h3 className="font-semibold text-sm">Alergias {allergies.length ? `(${allergies.length})` : ""}</h3>
            </div>
            {allergies.length ? (
              <div className="flex flex-wrap gap-1.5">
                {allergies.slice(0, 6).map((a, i) => (
                  <span key={i} className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                    {a.allergen}{a.severity ? ` · ${a.severity}` : ""}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-emerald-800/80">Sin alergias registradas.</p>
            )}
          </div>

          {/* Antecedentes médicos */}
          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
            <div className="flex items-center gap-2 text-slate-700 mb-2">
              <HeartPulse className="h-4 w-4 text-brand" />
              <h3 className="font-semibold text-sm">Antecedentes {medicalHistory.length ? `(${medicalHistory.length})` : ""}</h3>
            </div>
            {medicalHistory.length ? (
              <ul className="space-y-1 text-sm text-muted-foreground">
                {medicalHistory.slice(0, 3).map((m, i) => (
                  <li key={i} className="truncate">• {m.condition}</li>
                ))}
                {medicalHistory.length > 3 && (
                  <li><button onClick={() => setActiveTab("medical")} className="text-brand text-xs font-medium hover:underline">Ver todos →</button></li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Sin antecedentes registrados.</p>
            )}
          </div>
        </div>

        {/* 3. CONTENIDO DE LA SECCIÓN (full-width) */}
        <div className="rounded-2xl border border-border/70 bg-card p-5 md:p-7 shadow-soft text-slate-800 dark:text-slate-200">
          <TabsContent value="administrative" className="mt-0 outline-none">
            <PersonalTab patient={patient} />
          </TabsContent>

          <TabsContent value="medical" className="mt-0 outline-none space-y-8">
            <div>
              <h2 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200 border-b border-border pb-2">Antecedentes Mórbidos</h2>
              <MedicalHistoryTab patientId={patient.id} />
            </div>
            <div>
              <h2 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200 border-b border-border pb-2">Alergias Conocidas</h2>
              <AllergiesTab patientId={patient.id} />
            </div>
          </TabsContent>

          <TabsContent value="ficha" className="mt-0 outline-none">
            <ClinicalRecordTab patientId={patient.id} />
          </TabsContent>

          <TabsContent value="clinical" className="mt-0 outline-none">
            <ProceduresTab patientId={patient.id} />
          </TabsContent>

          <TabsContent value="appointments" className="mt-0 outline-none">
            <PatientAppointmentsTab patientId={patient.id} />
          </TabsContent>

          <TabsContent value="consents" className="mt-0 outline-none">
            <ConsentsTab patientId={patient.id} patientName={patient.full_name} />
          </TabsContent>

          <TabsContent value="loyalty" className="mt-0 outline-none">
            <LoyaltyTab patientId={patient.id} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
