"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { usePatients } from "@/hooks/usePatients"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, ExternalLink, UserX } from "lucide-react"
import Link from "next/link"
import { formatRut } from "@/lib/validations/rut"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

type PatientSummary = { upcoming: boolean; done: number; pendingConsent: boolean }

export function PatientList() {
  const { data: patients, isLoading, error } = usePatients()
  const { data: summary = {} } = useQuery<Record<string, PatientSummary>>({
    queryKey: ["patients-summary"],
    queryFn: async () => {
      const r = await fetch("/api/patients/summary")
      return r.ok ? r.json() : {}
    },
  })
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const queryClient = useQueryClient()

  const handleDeactivate = async () => {
    if (!patientToDelete) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/patients/${patientToDelete}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Error al desactivar el paciente")
      }
      toast.success("Paciente desactivado. Su historial clínico se conserva íntegro.")
      queryClient.invalidateQueries({ queryKey: ["patients"] })
    } catch (error: any) {
      toast.error(error.message)
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

      <div className="rounded-2xl border border-border/70 bg-card shadow-soft overflow-hidden">
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
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Estado</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {filteredPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    onClick={() => router.push(`/admin/patients/${patient.id}`)}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer"
                  >
                    <td className="p-4 align-middle font-medium">{patient.full_name}</td>
                    <td className="p-4 align-middle">{patient.rut ? formatRut(patient.rut) : "-"}</td>
                    <td className="p-4 align-middle">{patient.phone || "-"}</td>
                    <td className="p-4 align-middle">{patient.email}</td>
                    <td className="p-4 align-middle">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(() => {
                          const s = summary[patient.id]
                          if (!s) return <span className="text-xs text-muted-foreground">—</span>
                          const chips = []
                          if (s.upcoming) chips.push(<span key="up" className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-brand">Agendado</span>)
                          if (s.done > 0) chips.push(<span key="dn" className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">{s.done} realizado{s.done === 1 ? "" : "s"}</span>)
                          if (s.pendingConsent) chips.push(<span key="cs" className="inline-flex items-center rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-medium text-warning">Consentimiento pendiente</span>)
                          return chips.length ? chips : <span className="text-xs text-muted-foreground">—</span>
                        })()}
                      </div>
                    </td>
                    <td className="p-4 align-middle text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" render={<Link href={`/admin/patients/${patient.id}`} />}>
                            Ver Ficha <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                          onClick={() => setPatientToDelete(patient.id)}
                          title="Desactivar paciente"
                        >
                          <UserX className="h-4 w-4" />
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
        title="¿Desactivar paciente?"
        description="El paciente dejará de aparecer en la lista activa. Su historial clínico, citas y puntos de fidelidad se conservan íntegramente y puede ser reactivado desde su ficha."
        confirmText={isDeleting ? "Desactivando..." : "Desactivar"}
        cancelText="Cancelar"
        onConfirm={handleDeactivate}
        isDanger={true}
      />
    </div>
  )
}
