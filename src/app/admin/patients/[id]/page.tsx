"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ChevronLeft, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { useRouter } from "next/navigation"
import { PersonalTab } from "@/components/admin/patients/tabs/PersonalTab"
import { MedicalHistoryTab } from "@/components/admin/patients/tabs/MedicalHistoryTab"
import { AllergiesTab } from "@/components/admin/patients/tabs/AllergiesTab"
import { ProceduresTab } from "@/components/admin/patients/tabs/ProceduresTab"
import { PatientAppointmentsTab } from "@/components/admin/patients/tabs/PatientAppointmentsTab"
import { LoyaltyTab } from "@/components/admin/patients/tabs/LoyaltyTab"
import { PatientSidebar } from "@/components/admin/patients/PatientSidebar"

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("clinical")
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", params.id],
    queryFn: async () => {
      const response = await fetch(`/api/patients/${params.id}`)
      if (!response.ok) throw new Error("Error al cargar paciente")
      return response.json()
    }
  })

  if (isLoading) return <div className="p-8 text-center text-slate-500">Cargando expediente clínico...</div>
  if (!patient) return <div className="p-8 text-center text-red-500 font-bold">Paciente no encontrado</div>

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-10">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full block">
        {/* 1. TOP HEADER (Premium Navy Banner) */}
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 pt-4 md:pt-6">
          <div className="bg-brand-panel text-white shadow-elevated relative z-10 rounded-2xl overflow-hidden">
            <div className="bg-grid opacity-50 absolute inset-0 pointer-events-none" />
            <div className="relative z-10 px-4 md:px-6 pt-4 md:pt-6 pb-0">
            <div className="flex items-start md:items-center gap-3 md:gap-6 mb-4 md:mb-6">
              <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white hover:bg-white/20 rounded-full h-8 w-8 md:h-10 md:w-10 shrink-0 mt-1 md:mt-0">
                <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
              </Button>
              
              <div className="h-12 w-12 md:h-20 md:w-20 rounded-full bg-white text-primary flex items-center justify-center text-xl md:text-3xl font-bold shadow-md shrink-0 border-2 md:border-4 border-primary outline outline-2 md:outline-4 outline-white/20">
                {patient.full_name.charAt(0).toUpperCase()}
              </div>
              
              <div className="flex-1 pb-0 md:pb-2 min-w-0">
                <h1 className="text-xl md:text-3xl font-bold tracking-tight mb-1 md:mb-2 truncate">{patient.full_name}</h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-white/90 text-sm">
                  <span className="font-medium bg-black/10 px-2 py-0.5 rounded w-max whitespace-nowrap">RUT: {patient.rut || "N/A"}</span>
                  <span className="hidden sm:inline opacity-80">|</span>
                  <span className="truncate">{patient.email || "Sin email"}</span>
                </div>
              </div>
            </div>
            
            {/* HORIZONTAL NAV (Controlled Tabs) */}
            <TabsList className="bg-transparent h-auto p-0 gap-4 md:gap-6 flex w-full max-w-full justify-start border-none overflow-x-auto pb-2 [&>button]:shrink-0">
              <TabsTrigger 
                value="administrative" 
                className="text-white/70 hover:text-white data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-4 border-transparent data-[state=active]:border-white rounded-none pb-3 px-1 font-semibold text-sm uppercase tracking-wider transition-all whitespace-nowrap"
              >
                Datos administrativos
              </TabsTrigger>
              <TabsTrigger 
                value="medical" 
                className="text-white/70 hover:text-white data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-4 border-transparent data-[state=active]:border-white rounded-none pb-3 px-1 font-semibold text-sm uppercase tracking-wider transition-all whitespace-nowrap"
              >
                Antecedentes médicos
              </TabsTrigger>
              <TabsTrigger 
                value="clinical" 
                className="text-white/70 hover:text-white data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-4 border-transparent data-[state=active]:border-white rounded-none pb-3 px-1 font-semibold text-sm uppercase tracking-wider transition-all whitespace-nowrap"
              >
                Ficha Clínica
              </TabsTrigger>
              <TabsTrigger 
                value="appointments" 
                className="text-white/70 hover:text-white data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-4 border-transparent data-[state=active]:border-white rounded-none pb-3 px-1 font-semibold text-sm uppercase tracking-wider transition-all whitespace-nowrap"
              >
                Atenciones
              </TabsTrigger>
              <TabsTrigger 
                value="loyalty" 
                className="text-white/70 hover:text-white data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-4 border-transparent data-[state=active]:border-white rounded-none pb-3 px-1 font-semibold text-sm uppercase tracking-wider transition-all whitespace-nowrap"
              >
                Fidelidad
              </TabsTrigger>
            </TabsList>
            </div>
          </div>
        </div>

        {/* 2. MAIN LAYOUT */}
        <div className="w-full pt-4">
          <div className="max-w-[1600px] mx-auto px-4 md:px-6 mb-4 flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-slate-500 hover:text-slate-700 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
            >
              {isSidebarOpen ? <PanelLeftClose className="h-4 w-4 mr-2" /> : <PanelLeftOpen className="h-4 w-4 mr-2" />}
              {isSidebarOpen ? "Ocultar panel lateral" : "Mostrar panel lateral"}
            </Button>
          </div>
          <div className={`max-w-[1600px] mx-auto px-4 md:px-6 grid gap-6 items-start transition-all duration-300 ${isSidebarOpen ? 'grid-cols-1 md:grid-cols-[300px_1fr]' : 'grid-cols-1'}`}>
            
            {/* LEFT SIDEBAR */}
            {isSidebarOpen && (
              <div className="md:sticky top-6">
                <PatientSidebar patient={patient} setActiveTab={setActiveTab} activeTab={activeTab} />
              </div>
            )}

            {/* MAIN TABS CONTENT */}
            <div className="rounded-2xl border border-border/70 bg-card p-6 min-w-0 w-full shadow-soft text-slate-800 dark:text-slate-200">
              <TabsContent value="administrative" className="mt-0 outline-none">
                <PersonalTab patient={patient} />
              </TabsContent>
              
              <TabsContent value="medical" className="mt-0 outline-none space-y-8">
                <div>
                  <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200 border-b pb-2">Antecedentes Mórbidos</h2>
                  <MedicalHistoryTab patientId={patient.id} />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200 border-b pb-2">Alergias Conocidas</h2>
                  <AllergiesTab patientId={patient.id} />
                </div>
              </TabsContent>

              <TabsContent value="clinical" className="mt-0 outline-none">
                <ProceduresTab patientId={patient.id} />
              </TabsContent>

              <TabsContent value="appointments" className="mt-0 outline-none">
                <PatientAppointmentsTab patientId={patient.id} />
              </TabsContent>

              <TabsContent value="loyalty" className="mt-0 outline-none">
                <LoyaltyTab patientId={patient.id} />
              </TabsContent>
            </div>

          </div>
        </div>
      </Tabs>
    </div>
  )
}
