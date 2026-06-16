"use client"

import { useState } from "react"
import { ServiceList } from "@/components/admin/services/ServiceList"
import { ServiceForm } from "@/components/admin/services/ServiceForm"
import { useCreateService } from "@/hooks/useServices"
import { PageHeader } from "@/components/admin/PageHeader"
import { Button } from "@/components/ui/button"
import { Plus, Sparkles } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"

export default function ServicesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const createService = useCreateService()

  const handleCreateSubmit = async (data: any) => {
    try {
      await createService.mutateAsync(data)
      toast.success("Servicio creado exitosamente")
      setIsCreateOpen(false)
    } catch (error: any) {
      toast.error(error.message || "Error al crear el servicio")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catálogo de Servicios"
        description="Gestiona los procedimientos y servicios que ofrece la clínica."
        icon={Sparkles}
      >
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger
            render={
              <Button className="bg-brand text-white hover:bg-brand-dark rounded-xl shadow-glow">
                <Plus className="mr-2 h-4 w-4" /> Nuevo Servicio
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Servicio</DialogTitle>
            </DialogHeader>
            <ServiceForm
              onSubmit={handleCreateSubmit}
              isSubmitting={createService.isPending}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <ServiceList />
    </div>
  )
}

