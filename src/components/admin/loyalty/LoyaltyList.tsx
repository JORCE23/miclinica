"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Award, Plus, Search } from "lucide-react"
import { LoyaltyAdjustForm } from "./LoyaltyAdjustForm"

export function LoyaltyList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [adjustModalOpen, setAdjustModalOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<{ id: string, name: string } | null>(null)

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["loyalty_accounts"],
    queryFn: async () => {
      const res = await fetch("/api/loyalty")
      if (!res.ok) throw new Error("Error al cargar cuentas de fidelidad")
      return res.json()
    }
  })

  const filteredAccounts = accounts?.filter((acc: any) => 
    acc.patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (acc.patient.rut && acc.patient.rut.includes(searchTerm)) ||
    (acc.patient.email && acc.patient.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleAdjustClick = (patientId: string, patientName: string) => {
    setSelectedPatient({ id: patientId, name: patientName })
    setAdjustModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full max-w-sm">
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

      <div className="relative w-full overflow-x-auto rounded-md border bg-card">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>RUT</TableHead>
              <TableHead className="text-right">Saldo Actual</TableHead>
              <TableHead className="text-right">Puntos Totales (Histórico)</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">Cargando cuentas...</TableCell>
              </TableRow>
            ) : filteredAccounts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">No se encontraron cuentas.</TableCell>
              </TableRow>
            ) : (
              filteredAccounts?.map((acc: any) => (
                <TableRow key={acc.id}>
                  <TableCell className="font-medium">{acc.patient.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{acc.patient.rut || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <span className="font-bold text-amber-500 text-lg">{acc.total_points}</span>
                      <Award className="h-4 w-4 text-amber-500" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {acc.lifetime_points}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAdjustClick(acc.patient.id, acc.patient.full_name)}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Ajustar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedPatient && (
        <LoyaltyAdjustForm
          open={adjustModalOpen}
          onOpenChange={setAdjustModalOpen}
          patientId={selectedPatient.id}
          patientName={selectedPatient.name}
        />
      )}
    </div>
  )
}
