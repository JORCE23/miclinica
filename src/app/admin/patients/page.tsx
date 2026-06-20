"use client"

import { PatientList } from "@/components/admin/patients/PatientList"
import { PageHeader } from "@/components/admin/PageHeader"
import { Button } from "@/components/ui/button"
import { Plus, Users } from "lucide-react"
import { useAdminModals } from "@/components/admin/AdminModals"

export default function PatientsPage() {
  const { openPatient } = useAdminModals()
  return (
    <div className="space-y-6">
      <PageHeader title="Pacientes" icon={Users}>
        <Button onClick={() => openPatient()} className="bg-brand text-white hover:bg-brand-dark rounded-xl shadow-glow">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Paciente
        </Button>
      </PageHeader>

      <PatientList />
    </div>
  )
}
