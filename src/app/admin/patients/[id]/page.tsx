"use client"

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

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", params.id],
    queryFn: async () => {
      const response = await fetch(`/api/patients/${params.id}`)
      if (!response.ok) throw new Error("Error al cargar paciente")
      return response.json()
    }
  })

  if (isLoading) return <div className="p-8 text-center">Cargando...</div>
  if (!patient) return <div className="p-8 text-center text-red-500">Paciente no encontrado</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 bg-white dark:bg-slate-900 p-6 rounded-xl border shadow-sm">
        <Button variant="outline" size="icon" onClick={() => router.back()} className="mr-2 rounded-full">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="h-16 w-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-2xl font-bold text-rose-600 dark:text-rose-400">
          {patient.full_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {patient.full_name}
          </h1>
          <div className="flex items-center mt-1 space-x-3 text-sm text-muted-foreground">
            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-medium">
              RUT: {patient.rut || "N/A"}
            </span>
            <span className="flex items-center">
              <span className={`h-2 w-2 rounded-full mr-2 ${patient.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              {patient.is_active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="personal" className="w-full flex-col">
        <div className="overflow-x-auto pb-2 no-scrollbar">
          <TabsList className="inline-flex w-max min-w-full h-12 p-1 gap-1 justify-start bg-muted/50 rounded-xl">
            <TabsTrigger value="personal" className="py-2 px-6 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm transition-all font-medium">Datos Personales</TabsTrigger>
            <TabsTrigger value="medical" className="py-2 px-6 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm transition-all font-medium">Ant. Mórbidos</TabsTrigger>
            <TabsTrigger value="allergies" className="py-2 px-6 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm transition-all font-medium">Alergias</TabsTrigger>
            <TabsTrigger value="procedures" className="py-2 px-6 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm transition-all font-medium">Proc. Previos</TabsTrigger>
            <TabsTrigger value="appointments" className="py-2 px-6 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm transition-all font-medium">Citas</TabsTrigger>
            <TabsTrigger value="loyalty" className="py-2 px-6 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm transition-all font-medium flex items-center gap-2">
              <span className="text-amber-500 font-bold">★</span> Fidelidad
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-6 border bg-card rounded-lg p-6">
          <TabsContent value="personal">
            <PersonalTab patient={patient} />
          </TabsContent>
          <TabsContent value="medical">
            <MedicalHistoryTab patientId={patient.id} />
          </TabsContent>
          <TabsContent value="allergies">
            <AllergiesTab patientId={patient.id} />
          </TabsContent>
          <TabsContent value="procedures">
            <ProceduresTab patientId={patient.id} />
          </TabsContent>
          <TabsContent value="appointments">
            <PatientAppointmentsTab patientId={patient.id} />
          </TabsContent>
          <TabsContent value="loyalty">
            <LoyaltyTab patientId={patient.id} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
