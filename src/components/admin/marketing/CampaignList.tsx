"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Campaign } from "@/types"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Megaphone, Mail, MessageCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

export function CampaignList() {
  const queryClient = useQueryClient()

  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const res = await fetch('/api/campaigns')
      if (!res.ok) throw new Error('Error al cargar campañas')
      return res.json()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success("Campaña eliminada exitosamente")
    },
    onError: () => {
      toast.error("Hubo un error al eliminar la campaña")
    }
  })

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta campaña?")) {
      deleteMutation.mutate(id)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4 mr-1 inline" />
      case 'whatsapp': return <MessageCircle className="h-4 w-4 mr-1 inline" />
      default: return <Megaphone className="h-4 w-4 mr-1 inline" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active': return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Activa</Badge>
      case 'draft': return <Badge variant="outline" className="bg-slate-50 text-slate-600">Borrador</Badge>
      case 'completed': return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Completada</Badge>
      case 'paused': return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Pausada</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  if (isLoading) return <div className="p-8 text-center text-[#6B7E94]">Cargando campañas...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#162439]">Marketing y Campañas</h2>
        <Link href="/admin/marketing/new">
          <Button className="bg-[#162439] hover:bg-[#1E304D] text-white">
            <Plus className="w-4 h-4 mr-2" /> Nueva Campaña
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#D8E2ED] overflow-hidden">
        <Table className="admin-table">
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Rendimiento</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-[#6B7E94]">
                  No hay campañas registradas
                </TableCell>
              </TableRow>
            )}
            {campaigns?.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell className="font-medium text-[#162439]">{campaign.name}</TableCell>
                <TableCell className="text-[#6B7E94]">
                  <span className="flex items-center capitalize">
                    {getTypeIcon(campaign.type)} {campaign.type}
                  </span>
                </TableCell>
                <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                <TableCell className="text-[#6B7E94]">
                  <div className="text-xs space-y-1">
                    <div>Alcance: <span className="font-medium">{campaign.reach || 0}</span></div>
                    <div>Conv.: <span className="font-medium text-[#162439]">{campaign.conversions || 0}</span></div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/marketing/${campaign.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[#7B9AB5] hover:text-[#162439]">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(campaign.id)}
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
