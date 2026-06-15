"use client"

import { useState } from "react"
import { usePatients } from "@/hooks/usePatients"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, ExternalLink, Trash2 } from "lucide-react"
import Link from "next/link"
import { formatRut } from "@/lib/validations/rut"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { useQueryClient } from "@tanstack/react-query"

export function PatientList() {
  const { data: patients, isLoading, error } = usePatients()
  const [searchTerm, setSearchTerm] = useState("")
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const queryClient = useQueryClient()

  const handleDelete = async () => {
    if (!patientToDelete) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/patients/${patientToDelete}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Error al borrar el paciente")
      }
      queryClient.invalidateQueries({ queryKey: ["patients"] })
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsDeleting(false)
      setPatientToDelete(null)
    }
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500 border rounded-md">
        Error al cargar los pacientes: {error.message}
      </div>
    )
  }

  const filteredPatients = patients?.filter((patient) => {
    const term = searchTerm.toLowerCase()
    return (
      patient.full_name?.toLowerCase().includes(term) ||
      patient.rut?.toLowerCase().includes(term) ||
      patient.email?.toLowerCase().includes(term)
    )
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre, RUT o email..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md bg-white">
        {isLoading ? (
          <div className="p-4 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredPatients && filteredPatients.length > 0 ? (
          <div className="relative w-full overflow-x-auto">
            <table className="w-full caption-bottom text-sm min-w-[800px]">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Nombre</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">RUT</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Teléfono</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <td className="p-4 align-middle font-medium">{patient.full_name}</td>
                    <td className="p-4 align-middle">{patient.rut ? formatRut(patient.rut) : "-"}</td>
                    <td className="p-4 align-middle">{patient.phone || "-"}</td>
                    <td className="p-4 align-middle">{patient.email}</td>
                    <td className="p-4 align-middle text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" render={<Link href={`/admin/patients/${patient.id}`} />}>
                            Ver Ficha <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setPatientToDelete(patient.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No se encontraron pacientes que coincidan con la búsqueda.
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!patientToDelete}
        onOpenChange={(open) => !open && setPatientToDelete(null)}
        title="¿Borrar paciente?"
        description="Esta acción es irreversible. Se borrará el paciente junto con todo su historial médico, citas, y puntos de fidelidad."
        confirmText={isDeleting ? "Borrando..." : "Borrar"}
        cancelText="Cancelar"
        onConfirm={handleDelete}
        isDanger={true}
      />
    </div>
  )
}
