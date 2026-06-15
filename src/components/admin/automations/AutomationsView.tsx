"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Clock, Gift, Star, MessageSquare, Loader2 } from "lucide-react"
import { toast } from "sonner"

const AUTOMATION_META: Record<string, { title: string, description: string, icon: any, channel: string }> = {
  "reminder-24h": {
    title: "Recordatorio de Cita (24h antes)",
    description: "Envía un mensaje a los pacientes 24 horas antes de su cita para confirmar asistencia.",
    icon: Clock,
    channel: "WhatsApp",
  },
  "birthday": {
    title: "Saludo de Cumpleaños",
    description: "Envía un mensaje automático felicitando al paciente en su cumpleaños.",
    icon: Gift,
    channel: "Email",
  },
  "post-appointment-review": {
    title: "Solicitud de Review",
    description: "Envía un mensaje después de la cita solicitando una reseña o retroalimentación.",
    icon: Star,
    channel: "SMS",
  },
  "follow-up-botox": {
    title: "Seguimiento Tratamiento (14 días)",
    description: "Mensaje automático a los 14 días para control de resultados.",
    icon: MessageSquare,
    channel: "WhatsApp",
  }
}

export function AutomationsView() {
  const queryClient = useQueryClient()
  const [editingAutomation, setEditingAutomation] = useState<any>(null)
  const [editMessage, setEditMessage] = useState("")

  const { data: automations, isLoading } = useQuery({
    queryKey: ["automations"],
    queryFn: async () => {
      const res = await fetch("/api/automations")
      if (!res.ok) throw new Error("Error cargando automatizaciones")
      return res.json()
    }
  })

  const mutation = useMutation({
    mutationFn: async (data: { type: string, is_active: boolean, message_template: string }) => {
      const res = await fetch("/api/automations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error("Error guardando automatización")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] })
      toast.success("Automatización actualizada")
      setEditingAutomation(null)
    },
    onError: () => {
      toast.error("No se pudo guardar la configuración")
    }
  })

  const toggleAutomation = (automation: any) => {
    mutation.mutate({
      type: automation.type,
      is_active: !automation.is_active,
      message_template: automation.message_template
    })
  }

  const handleEditClick = (automation: any) => {
    setEditingAutomation(automation)
    setEditMessage(automation.message_template)
  }

  const handleSaveMessage = () => {
    if (!editingAutomation) return
    mutation.mutate({
      type: editingAutomation.type,
      is_active: editingAutomation.is_active,
      message_template: editMessage
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#162439]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {automations?.map((automation: any) => {
          const meta = AUTOMATION_META[automation.type] || AUTOMATION_META["reminder-24h"]
          const Icon = meta.icon

          return (
            <div 
              key={automation.type} 
              className={`bg-white p-6 rounded-xl border ${automation.is_active ? 'border-[#7B9AB5] shadow-md' : 'border-[#D8E2ED] shadow-sm'} transition-all`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${automation.is_active ? 'bg-[#162439] text-white' : 'bg-[#F0F3F7] text-[#6B7E94]'}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#162439]">{meta.title}</h3>
                    <Badge variant="secondary" className="mt-1 font-normal text-xs bg-slate-100">
                      {meta.channel}
                    </Badge>
                  </div>
                </div>
                <Switch 
                  checked={automation.is_active} 
                  onCheckedChange={() => toggleAutomation(automation)} 
                  disabled={mutation.isPending}
                />
              </div>
              <p className="text-sm text-[#6B7E94] leading-relaxed">
                {meta.description}
              </p>
              
              {automation.is_active && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    • Activo y funcionando
                  </span>
                  <button 
                    onClick={() => handleEditClick(automation)}
                    className="text-xs font-medium text-[#7B9AB5] hover:text-[#162439] underline"
                  >
                    Editar mensaje
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Dialog open={!!editingAutomation} onOpenChange={(open) => !open && setEditingAutomation(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Mensaje Automático</DialogTitle>
            <DialogDescription>
              Personaliza el mensaje que recibirán tus pacientes. Puedes usar variables como {'{{patient_name}}'}, {'{{appointment_time}}'} o {'{{service_name}}'}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={editMessage}
              onChange={(e) => setEditMessage(e.target.value)}
              className="min-h-[150px] resize-none"
              placeholder="Escribe el mensaje aquí..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAutomation(null)}>Cancelar</Button>
            <Button onClick={handleSaveMessage} disabled={mutation.isPending}>
              {mutation.isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
