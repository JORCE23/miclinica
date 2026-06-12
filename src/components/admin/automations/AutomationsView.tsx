"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Clock, Gift, Star, MessageSquare } from "lucide-react"

const AUTOMATIONS = [
  {
    id: "reminder-24h",
    title: "Recordatorio de Cita (24h antes)",
    description: "Envía un mensaje de WhatsApp a los pacientes 24 horas antes de su cita para confirmar asistencia.",
    icon: Clock,
    channel: "WhatsApp",
    active: true,
  },
  {
    id: "birthday",
    title: "Saludo de Cumpleaños",
    description: "Envía un correo electrónico automático felicitando al paciente en su cumpleaños con un descuento.",
    icon: Gift,
    channel: "Email",
    active: false,
  },
  {
    id: "post-appointment-review",
    title: "Solicitud de Review",
    description: "Envía un SMS 2 horas después de la cita solicitando una reseña en Google o retroalimentación interna.",
    icon: Star,
    channel: "SMS",
    active: true,
  },
  {
    id: "follow-up-botox",
    title: "Seguimiento Tratamiento (14 días)",
    description: "Mensaje automático a los 14 días para tratamientos como Botox para control de resultados.",
    icon: MessageSquare,
    channel: "WhatsApp",
    active: false,
  }
]

export function AutomationsView() {
  const [automations, setAutomations] = useState(AUTOMATIONS)

  const toggleAutomation = (id: string) => {
    setAutomations(prev => prev.map(a => 
      a.id === id ? { ...a, active: !a.active } : a
    ))
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {automations.map((automation) => (
          <div 
            key={automation.id} 
            className={`bg-white p-6 rounded-xl border ${automation.active ? 'border-[#7B9AB5] shadow-md' : 'border-[#D8E2ED] shadow-sm'} transition-all`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${automation.active ? 'bg-[#162439] text-white' : 'bg-[#F0F3F7] text-[#6B7E94]'}`}>
                  <automation.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#162439]">{automation.title}</h3>
                  <Badge variant="secondary" className="mt-1 font-normal text-xs bg-slate-100">
                    {automation.channel}
                  </Badge>
                </div>
              </div>
              <Switch 
                checked={automation.active} 
                onCheckedChange={() => toggleAutomation(automation.id)} 
              />
            </div>
            <p className="text-sm text-[#6B7E94] leading-relaxed">
              {automation.description}
            </p>
            
            {automation.active && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  • Activo y funcionando
                </span>
                <button className="text-xs font-medium text-[#7B9AB5] hover:text-[#162439] underline">
                  Editar mensaje
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
