import { PatientList } from "@/components/admin/patients/PatientList"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function PatientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
        <Button asChild>
          <Link href="/admin/patients/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Paciente
          </Link>
        </Button>
      </div>
      
      <PatientList />
    </div>
  )
}
