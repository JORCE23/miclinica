"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Professional } from "@/types"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { useAdminModals } from "@/components/admin/AdminModals"
import { Avatar } from "@/components/shared/Avatar"

export function ProfessionalList() {
  const queryClient = useQueryClient()
  const { openProfessional } = useAdminModals()

  const { data: professionals, isLoading } = useQuery<Professional[]>({
    queryKey: ['professionals'],
    queryFn: async () => {
      const res = await fetch('/api/professionals')
      if (!res.ok) throw new Error('Error al cargar profesionales')
      return res.json()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/professionals/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] })
      toast.success("Profesional eliminado exitosamente")
    },
    onError: () => {
      toast.error("Hubo un error al eliminar el profesional")
    }
  })

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar a este profesional?")) {
      deleteMutation.mutate(id)
    }
  }

  if (isLoading) return <div className="p-8 text-center text-[#6B7E94]">Cargando equipo...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-end items-center">
        <Button onClick={() => openProfessional()} className="bg-brand text-white hover:bg-brand-dark rounded-xl shadow-glow">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Profesional
        </Button>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card shadow-soft overflow-x-auto">
        <Table className="admin-table min-w-[700px]">
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Especialidad</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {professionals?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-[#6B7E94]">
                  No hay profesionales registrados
                </TableCell>
              </TableRow>
            )}
            {professionals?.map((professional) => (
              <TableRow key={professional.id}>
                <TableCell className="font-medium text-foreground">
                  <div className="flex items-center gap-3">
                    <Avatar src={professional.avatar_url} name={professional.full_name} size={36} />
                    <span>{professional.full_name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-[#6B7E94]">{professional.specialty || '-'}</TableCell>
                <TableCell className="text-[#6B7E94]">{professional.email || '-'}</TableCell>
                <TableCell className="text-[#6B7E94]">{professional.phone || '-'}</TableCell>
                <TableCell>
                  {professional.is_active ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">Activo</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-slate-50 text-slate-600">Inactivo</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/professionals/${professional.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[#7B9AB5] hover:text-foreground">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(professional.id)}
                      className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
