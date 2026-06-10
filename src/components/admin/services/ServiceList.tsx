"use client"

import { useState } from "react"
import { useServices, useUpdateService, useDeleteService } from "@/hooks/useServices"
import { Service } from "@/types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Clock, DollarSign, Star } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ServiceForm } from "./ServiceForm"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"

export function ServiceList() {
  const { data: services, isLoading } = useServices()
  const updateService = useUpdateService()
  const deleteService = useDeleteService()

  const [editingService, setEditingService] = useState<Service | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const [deletingService, setDeletingService] = useState<Service | null>(null)

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando servicios...</div>
  }

  if (!services || services.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <h3 className="mb-2 text-lg font-medium">No hay servicios registrados</h3>
        <p className="text-sm text-muted-foreground">
          Crea tu primer servicio para empezar a agendar citas.
        </p>
      </div>
    )
  }

  const handleEditSubmit = async (data: any) => {
    if (!editingService) return
    try {
      await updateService.mutateAsync({ id: editingService.id, data })
      toast.success("Servicio actualizado exitosamente")
      setIsEditDialogOpen(false)
      setEditingService(null)
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar")
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingService) return
    try {
      await deleteService.mutateAsync(deletingService.id)
      toast.success("Servicio desactivado exitosamente")
      setDeletingService(null)
    } catch (error: any) {
      toast.error(error.message || "Error al desactivar")
    }
  }

  return (
    <>
      <div className="relative w-full overflow-x-auto rounded-md border bg-card">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead>Nombre del Servicio</TableHead>
              <TableHead>Duración</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Puntos Otorga</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell>
                  <div className="font-medium flex items-center gap-2">
                    {service.name}
                    {service.category && (
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">
                        {service.category}
                      </Badge>
                    )}
                  </div>
                  {service.description && (
                    <div className="text-xs text-muted-foreground truncate max-w-[250px] mt-1">
                      {service.description}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="mr-1 h-3 w-3" />
                    {service.duration_minutes} min
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm">
                    <DollarSign className="mr-1 h-3 w-3 text-muted-foreground" />
                    {service.price ? service.price.toLocaleString("es-CL") : "N/A"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm font-medium text-rose-600 dark:text-rose-400">
                    <Star className="mr-1 h-3 w-3 fill-current" />
                    {service.loyalty_points_earned} pts
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={service.is_active ? "default" : "secondary"} className={service.is_active ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                    {service.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setEditingService(service)
                        setIsEditDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setDeletingService(service)}
                      disabled={!service.is_active}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Servicio</DialogTitle>
          </DialogHeader>
          {editingService && (
            <ServiceForm 
              initialData={editingService} 
              onSubmit={handleEditSubmit} 
              isSubmitting={updateService.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingService}
        onOpenChange={(open) => !open && setDeletingService(null)}
        title="Desactivar Servicio"
        description={`¿Estás seguro de que deseas desactivar "${deletingService?.name}"? Ya no estará disponible para nuevas reservas.`}
        confirmText="Desactivar"
        cancelText="Cancelar"
        onConfirm={handleDeleteConfirm}
        isDanger={true}
      />
    </>
  )
}
