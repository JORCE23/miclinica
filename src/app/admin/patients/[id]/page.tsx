"use client"

import { useState, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft, Pencil, Calendar, Bell, ShieldAlert, ShieldCheck, HeartPulse,
  CalendarDays, Phone, Activity, Mail, IdCard, FileSignature, ClipboardList, Wand2, Sparkles, ScanFace,
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
import { SimulationTab } from "@/components/admin/patients/tabs/SimulationTab"
import { AiSummaryTab } from "@/components/admin/patients/tabs/AiSummaryTab"
import { AnalisisFacialTab } from "@/components/admin/patients/tabs/AnalisisFacialTab"
import { WhatsappButton } from "@/components/admin/WhatsappButton"
import { MailButton } from "@/components/admin/MailButton"

const TABS = [
  { value: "ficha", label: "Ficha Clínica", icon: ClipboardList },
  { value: "ai-summary", label: "Resumen IA", icon: Sparkles },
  { value: "clinical", label: "Procedimientos", icon: Activity },
  { value: "facial-ia", label: "Análisis facial IA", icon: ScanFace },
  { value: "medical", label: "Antecedentes", icon: HeartPulse },
  { value: "appointments", label: "Atenciones", icon: Calendar },
  { value: "consents", label: "Consentimientos", icon: FileSignature },
  { value: "simulation", label: "Simulación", icon: Wand2 },
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
  const contentRef = useRef<HTMLDivElement>(null)

  // Cambia de sección y baja automáticamente al contenido (útil en móvil).
  const goToTab = (value: string) => {
    setActiveTab(value)
    requestAnimationFrame(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

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

  // Ficha clínica: para mostrar también su texto de antecedentes/alergias en el resumen
  const { data: clinicalRecord } = useQuery<Record<string, string>>({
    queryKey: ["clinical-record", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/patients/${params.id}/clinical-record`)
      return res.ok ? res.json() : {}
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

  // Texto de la ficha clínica que se refleja en el resumen
  const recAlergias = (clinicalRecord?.alergias || "").trim()
  const recAntecedentes = (clinicalRecord?.antecedentes_morbidos || "").trim()
  const hasAllergy = allergies.length > 0 || !!recAlergias

  return (
    <div className="pb-10 space-y-5">
      <Tabs value={activeTab} onValueChange={goToTab} className="w-full block space-y-5">
        {/* 1. ENCABEZADO full-width */}
        <div className="rounded-2xl bg-card border border-border/70 shadow-soft">
          <div className="px-5 md:px-8 pt-5 md:pt-7">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-full h-9 w-9 shrink-0">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-brand/10 text-brand flex items-center justify-center text-2xl md:text-3xl font-bold shrink-0">
                  {patient.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight truncate text-foreground">{patient.full_name}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 bg-muted px-2 py-0.5 rounded-lg"><IdCard className="h-3.5 w-3.5" /> {patient.rut || "Sin RUT"}</span>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg ${patient.is_active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${patient.is_active ? "bg-emerald-500" : "bg-muted-foreground/40"}`} /> {patient.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 shrink-0">
                <WhatsappButton
                  phone={patient.phone}
                  message={`Hola ${patient.full_name.split(" ")[0]}, te saludamos de la clínica 👋`}
                  size="default"
                />
                <MailButton
                  email={patient.email}
                  subject={`Clínica · ${patient.full_name}`}
                  body={`Hola ${patient.full_name.split(" ")[0]},\n\n`}
                  size="default"
                />
                <Button variant="outline" onClick={() => goToTab("administrative")} className="rounded-xl">
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
                <div key={i} className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
                  <s.icon className="h-4 w-4 text-brand shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{s.label}</p>
                    <p className="text-sm text-foreground truncate">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Navegación por secciones */}
            <TabsList className="bg-transparent h-auto p-0 gap-1 flex w-full max-w-full justify-start border-none overflow-x-auto mt-5 border-t border-border/60 [&>button]:shrink-0">
              {TABS.map((t) => (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="group/tab flex items-center gap-2 text-muted-foreground hover:text-foreground data-[state=active]:text-brand data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-brand rounded-none -mb-px px-4 py-2.5 font-medium text-sm transition-all whitespace-nowrap"
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
          <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30 p-4">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 mb-2">
              <Bell className="h-4 w-4" />
              <h3 className="font-semibold text-sm">Notas internas</h3>
            </div>
            <p className="text-sm text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
              {patient.notes || "Sin notas internas registradas."}
            </p>
          </div>

          {/* Alergias (alerta de seguridad) */}
          <div className={`rounded-2xl border p-4 ${hasAllergy ? "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30" : "border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/30"}`}>
            <div className={`flex items-center gap-2 mb-2 ${hasAllergy ? "text-red-700 dark:text-red-300" : "text-emerald-700 dark:text-emerald-300"}`}>
              {hasAllergy ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              <h3 className="font-semibold text-sm">Alergias {allergies.length ? `(${allergies.length})` : ""}</h3>
            </div>
            {allergies.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {allergies.slice(0, 6).map((a, i) => (
                  <span key={i} className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                    {a.allergen}{a.severity ? ` · ${a.severity}` : ""}
                  </span>
                ))}
              </div>
            )}
            {recAlergias && (
              <p className="text-sm text-red-800/80 dark:text-red-300/80 leading-relaxed mt-1.5 whitespace-pre-wrap">{recAlergias}</p>
            )}
            {!hasAllergy && (
              <p className="text-sm text-emerald-800/80 dark:text-emerald-300/80">Sin alergias registradas.</p>
            )}
          </div>

          {/* Antecedentes médicos */}
          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 mb-2">
              <HeartPulse className="h-4 w-4 text-brand" />
              <h3 className="font-semibold text-sm">Antecedentes {medicalHistory.length ? `(${medicalHistory.length})` : ""}</h3>
            </div>
            {medicalHistory.length > 0 && (
              <ul className="space-y-1 text-sm text-muted-foreground">
                {medicalHistory.slice(0, 3).map((m, i) => (
                  <li key={i} className="truncate">• {m.condition}</li>
                ))}
                {medicalHistory.length > 3 && (
                  <li><button onClick={() => goToTab("medical")} className="text-brand text-xs font-medium hover:underline">Ver todos →</button></li>
                )}
              </ul>
            )}
            {recAntecedentes && (
              <p className="text-sm text-muted-foreground leading-relaxed mt-1.5 whitespace-pre-wrap">{recAntecedentes}</p>
            )}
            {medicalHistory.length === 0 && !recAntecedentes && (
              <p className="text-sm text-muted-foreground">Sin antecedentes registrados.</p>
            )}
          </div>
        </div>

        {/* 3. CONTENIDO DE LA SECCIÓN (full-width) */}
        <div ref={contentRef} className="scroll-mt-20 rounded-2xl border border-border/70 bg-card p-5 md:p-7 shadow-soft text-foreground dark:text-slate-200">
          <TabsContent value="administrative" className="mt-0 outline-none">
            <PersonalTab patient={patient} />
          </TabsContent>

          <TabsContent value="medical" className="mt-0 outline-none space-y-8">
            <div>
              <h2 className="text-lg font-bold mb-4 text-foreground dark:text-slate-200 border-b border-border pb-2">Antecedentes Mórbidos</h2>
              <MedicalHistoryTab patientId={patient.id} />
            </div>
            <div>
              <h2 className="text-lg font-bold mb-4 text-foreground dark:text-slate-200 border-b border-border pb-2">Alergias Conocidas</h2>
              <AllergiesTab patientId={patient.id} />
            </div>
          </TabsContent>

          <TabsContent value="ficha" className="mt-0 outline-none">
            <ClinicalRecordTab patientId={patient.id} patientName={patient.full_name} />
          </TabsContent>

          <TabsContent value="ai-summary" className="mt-0 outline-none">
            <AiSummaryTab patientId={patient.id} />
          </TabsContent>

          <TabsContent value="clinical" className="mt-0 outline-none">
            <ProceduresTab patientId={patient.id} />
          </TabsContent>

          <TabsContent value="facial-ia" className="mt-0 outline-none">
            <AnalisisFacialTab />
          </TabsContent>

          <TabsContent value="appointments" className="mt-0 outline-none">
            <PatientAppointmentsTab patientId={patient.id} />
          </TabsContent>

          <TabsContent value="consents" className="mt-0 outline-none">
            <ConsentsTab patientId={patient.id} patientName={patient.full_name} />
          </TabsContent>

          <TabsContent value="simulation" className="mt-0 outline-none">
            <SimulationTab patientId={patient.id} />
          </TabsContent>

          <TabsContent value="loyalty" className="mt-0 outline-none">
            <LoyaltyTab patientId={patient.id} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
