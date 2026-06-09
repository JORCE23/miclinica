import { PatientForm } from "@/components/admin/patients/PatientForm"

export default function NewPatientPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nuevo Paciente</h1>
        <p className="text-muted-foreground mt-2">
          Ingresa los datos para registrar un nuevo paciente en la clínica.
        </p>
      </div>
      
      <div className="rounded-md border bg-white shadow p-6">
        <PatientForm />
      </div>
    </div>
  )
}
