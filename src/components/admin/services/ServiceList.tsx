"use client"

import { useState, Fragment } from "react"
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
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Clock, DollarSign, Star, Package } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ServiceForm } from "./ServiceForm"
import { ServiceInsumosDialog } from "./ServiceInsumosDialog"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"

export function ServiceList() {
  const { data: services, isLoading } = useServices()
  const updateService = useUpdateService()
  const deleteService = useDeleteService()

  const [editingService, setEditingService] = useState<Service | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const [deletingService, setDeletingService] = useState<Service | null>(null)
  const [insumosService, setInsumosService] = useState<Service | null>(null)

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

  const handleToggleActive = async (service: Service) => {
    try {
      await updateService.mutateAsync({
        id: service.id,
        data: {
          name: service.name,
          description: service.description,
          duration_minutes: service.duration_minutes,
          price: service.price,
          loyalty_points_earned: service.loyalty_points_earned,
          is_active: !service.is_active,
        },
      })
      toast.success(service.is_active ? "Servicio desactivado" : "Servicio activado")
    } catch (error: any) {
      toast.error(error.message || "No se pudo actualizar")
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingService) return
    try {
      await deleteService.mutateAsync(deletingService.id)
      toast.success("Servicio eliminado exitosamente")
      setDeletingService(null)
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar")
    }
  }

  // Agrupar por área (Facial / Corporal) → categoría
  const SECTION_ORDER = ["Facial", "Corporal", "Sin área"]
  const bySection: Record<string, Service[]> = {}
  for (const s of services) {
    const sec = s.section || "Sin área"
    ;(bySection[sec] = bySection[sec] || []).push(s)
  }
  const sectionNames = [
    ...SECTION_ORDER.filter((s) => bySection[s]?.length),
    ...Object.keys(bySection).filter((s) => !SECTION_ORDER.includes(s)),
  ]
  const catOf = (s: Service) => s.category || "Sin categoría"

  const renderRow = (service: Service) => (
    <TableRow key={service.id} className={service.is_active ? "" : "opacity-55"}>
      <TableCell>
        <div className="font-medium">{service.name}</div>
        {service.description && (
          <div className="text-xs text-muted-foreground truncate max-w-[250px] mt-1">{service.description}</div>
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
        <div className="flex items-center text-sm font-medium text-foreground dark:text-rose-400">
          <Star className="mr-1 h-3 w-3 fill-current" />
          {service.loyalty_points_earned} pts
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Switch
            checked={service.is_active}
            onCheckedChange={() => handleToggleActive(service)}
            title={service.is_active ? "Desactivar servicio" : "Activar servicio"}
          />
          <span className="text-xs text-muted-foreground">{service.is_active ? "Activo" : "Inactivo"}</span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end space-x-2">
          <Button variant="ghost" size="icon" title="Insumos que consume" onClick={() => setInsumosService(service)}>
            <Package className="h-4 w-4 text-brand" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => { setEditingService(service); setIsEditDialogOpen(true) }}>
            <Edit className="h-4 w-4 text-slate-500" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeletingService(service)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )

  return (
    <>
      <div className="space-y-6">
        {sectionNames.map((sec) => {
          const items = [...bySection[sec]].sort((a, b) => catOf(a).localeCompare(catOf(b)) || a.name.localeCompare(b.name))
          return (
            <div key={sec} className="space-y-2">
              <h3 className="font-display text-lg font-semibold text-foreground px-1">{sec}</h3>
              <div className="relative w-full overflow-x-auto rounded-2xl border border-border/70 bg-card shadow-soft">
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
                    {items.map((s, idx) => {
                      const c = catOf(s)
                      const showHeader = idx === 0 || catOf(items[idx - 1]) !== c
                      return (
                        <Fragment key={s.id}>
                          {showHeader && (
                            <TableRow className="hover:bg-transparent border-b-0">
                              <TableCell colSpan={6} className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground py-2">{c}</TableCell>
                            </TableRow>
                          )}
                          {renderRow(s)}
                        </Fragment>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )
        })}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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

      {insumosService && (
        <ServiceInsumosDialog
          serviceId={insumosService.id}
          serviceName={insumosService.name}
          onClose={() => setInsumosService(null)}
        />
      )}

      <ConfirmDialog
        open={!!deletingService}
        onOpenChange={(open) => !open && setDeletingService(null)}
        title="Eliminar Servicio"
        description={`¿Estás seguro de que deseas eliminar permanentemente "${deletingService?.name}"? Si el servicio tiene reservas asociadas, no podrá ser eliminado por seguridad.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDeleteConfirm}
        isDanger={true}
      />
    </>
  )
}
