"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
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
      {/* 1. TOP HEADER (Primary Color Banner Style) */}
      <div className="bg-primary text-white shadow-md relative z-10">
        <div className="max-w-[1600px] mx-auto px-6 pt-6 pb-0">
          <div className="flex items-center gap-6 mb-6">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white hover:bg-white/20 rounded-full h-10 w-10 shrink-0">
              <ChevronLeft className="h-6 w-6" />
            </Button>
            
            <div className="h-20 w-20 rounded-full bg-white text-primary flex items-center justify-center text-3xl font-bold shadow-md shrink-0 border-4 border-primary outline outline-4 outline-white/20">
              {patient.full_name.charAt(0).toUpperCase()}
            </div>
            
            <div className="flex-1 pb-2">
              <h1 className="text-3xl font-bold tracking-tight mb-1">{patient.full_name}</h1>
              <div className="flex items-center gap-3 text-white/90 text-sm">
                <span className="font-medium bg-black/10 px-2 py-0.5 rounded">RUT: {patient.rut || "N/A"}</span>
                <span className="opacity-80">|</span>
                <span>{patient.email || "Sin email"}</span>
              </div>
            </div>
          </div>
          
          {/* HORIZONTAL NAV (Controlled Tabs) */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-transparent h-auto p-0 gap-6 flex justify-start border-none">
              <TabsTrigger 
                value="administrative" 
                className="text-white/70 hover:text-white data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-4 border-transparent data-[state=active]:border-white rounded-none pb-3 px-1 font-semibold text-sm uppercase tracking-wider transition-all"
              >
                Datos administrativos
              </TabsTrigger>
              <TabsTrigger 
                value="medical" 
                className="text-white/70 hover:text-white data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-4 border-transparent data-[state=active]:border-white rounded-none pb-3 px-1 font-semibold text-sm uppercase tracking-wider transition-all"
              >
                Antecedentes médicos
              </TabsTrigger>
              <TabsTrigger 
                value="clinical" 
                className="text-white/70 hover:text-white data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-4 border-transparent data-[state=active]:border-white rounded-none pb-3 px-1 font-semibold text-sm uppercase tracking-wider transition-all"
              >
                Ficha Clínica
              </TabsTrigger>
              <TabsTrigger 
                value="appointments" 
                className="text-white/70 hover:text-white data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-4 border-transparent data-[state=active]:border-white rounded-none pb-3 px-1 font-semibold text-sm uppercase tracking-wider transition-all"
              >
                Atenciones
              </TabsTrigger>
              <TabsTrigger 
                value="loyalty" 
                className="text-white/70 hover:text-white data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-4 border-transparent data-[state=active]:border-white rounded-none pb-3 px-1 font-semibold text-sm uppercase tracking-wider transition-all"
              >
                Fidelidad
              </TabsTrigger>
            </TabsList>

            {/* 2. MAIN LAYOUT */}
            <div className="absolute left-0 w-full top-full pt-6">
              <div className="max-w-[1600px] mx-auto px-6 grid grid-cols-[300px_1fr] gap-6 items-start">
                
                {/* LEFT SIDEBAR */}
                <div className="sticky top-6">
                  <PatientSidebar patient={patient} setActiveTab={setActiveTab} />
                </div>

                {/* MAIN TABS CONTENT */}
                <div className="border bg-card rounded-lg p-6 min-w-0 w-full shadow-sm text-slate-800 dark:text-slate-200">
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
      </div>
    </div>
  )
}
