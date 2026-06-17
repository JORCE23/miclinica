"use client"

import { useAppointments } from "@/hooks/useAppointments"
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { AppointmentStatusActions } from "./AppointmentStatusActions"
import { WhatsappButton } from "@/components/admin/WhatsappButton"
import { motion } from "framer-motion"
import { Calendar as CalendarIcon, Clock, Sparkles, Receipt } from "lucide-react"

// Mensaje de recordatorio prellenado para WhatsApp
function reminderMessage(apt: { scheduled_at: string; patient?: { full_name?: string }; service?: { name?: string } }) {
  const first = apt.patient?.full_name?.split(" ")[0] || ""
  const fecha = format(new Date(apt.scheduled_at), "EEEE d 'de' MMMM", { locale: es })
  const hora = format(new Date(apt.scheduled_at), "HH:mm")
  const servicio = apt.service?.name ? ` para ${apt.service.name}` : ""
  return `Hola ${first}, te recordamos tu cita el ${fecha} a las ${hora}${servicio}. ¡Te esperamos! 😊`
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
}

export function AppointmentList({ patientId }: { patientId?: string }) {
  const { data: appointments, isLoading } = useAppointments({ patient_id: patientId })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse p-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 w-full rounded-2xl bg-slate-200/50 dark:bg-slate-800/50"></div>
        ))}
      </div>
    )
  }

  if (!appointments || appointments.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl border border-dashed border-border/60 bg-muted/30 p-12 text-center"
      >
        <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <CalendarIcon className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h3 className="mb-2 text-xl font-bold tracking-tight">No hay citas registradas</h3>
        <p className="text-sm text-muted-foreground font-medium">
          No se encontraron reservas con los filtros actuales.
        </p>
      </motion.div>
    )
  }

  return (
    <>
      {/* Mobile View: Cards */}
      <div className="md:hidden space-y-4">
        {appointments.map((apt) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={apt.id}
            className="glass-card p-4 rounded-3xl flex flex-col gap-3"
          >
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="font-bold text-lg capitalize tracking-tight text-foreground">
                  {format(new Date(apt.scheduled_at), "EEEE d MMM", { locale: es })}
                </span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-primary mt-1">
                  <Clock className="h-4 w-4" />
                  {format(new Date(apt.scheduled_at), "HH:mm")} <span className="text-muted-foreground font-normal">({apt.duration_minutes} min)</span>
                </span>
              </div>
              <StatusBadge status={apt.status} />
            </div>

            {!patientId && (
              <div className="flex items-center gap-2 mt-2 bg-muted/50 p-3 rounded-2xl">
                <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">
                  {apt.patient?.full_name.charAt(0)}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="font-semibold text-sm truncate">{apt.patient?.full_name}</span>
                  <span className="text-xs text-muted-foreground">{apt.patient?.rut || apt.patient?.email}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-1 pt-3 border-t border-border/50">
              <div className="flex flex-col">
                <span className="text-sm font-semibold flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  {apt.service?.name || "Personalizado"}
                </span>
                {apt.price != null && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Receipt className="h-3 w-3" />
                    ${apt.price.toLocaleString("es-CL")}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <WhatsappButton phone={apt.patient?.phone} message={reminderMessage(apt)} iconOnly />
                <AppointmentStatusActions
                  appointmentId={apt.id}
                  currentStatus={apt.status}
                  loyaltyPoints={apt.service?.loyalty_points_earned}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Desktop View: Glass Table */}
      <div className="hidden md:block relative w-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
        <Table className="min-w-[1000px]">
          <TableHeader className="bg-muted/30">
            <TableRow className="border-b-border/50 hover:bg-transparent">
              <TableHead className="font-semibold py-4">Fecha y Hora</TableHead>
              {!patientId && <TableHead className="font-semibold">Paciente</TableHead>}
              <TableHead className="font-semibold">Servicio</TableHead>
              <TableHead className="font-semibold">Estado</TableHead>
              <TableHead className="text-right font-semibold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <motion.tbody 
            variants={container} 
            initial="hidden" 
            animate="show"
            className="[&_tr:last-child]:border-0"
          >
            {appointments.map((apt) => (
              <motion.tr 
                key={apt.id}
                variants={item}
                className="group border-b border-border/50 hover:bg-muted/40 transition-colors"
              >
                <TableCell className="py-4">
                  <div className="font-bold text-foreground capitalize tracking-tight">
                    {format(new Date(apt.scheduled_at), "EEEE d 'de' MMMM", { locale: es })}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-primary mt-1">
                    <Clock className="h-3.5 w-3.5" />
                    {format(new Date(apt.scheduled_at), "HH:mm")} 
                    <span className="text-muted-foreground font-normal">({apt.duration_minutes} min)</span>
                  </div>
                </TableCell>
                
                {!patientId && (
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-bold text-primary border border-primary/10">
                        {apt.patient?.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{apt.patient?.full_name}</div>
                        <div className="text-xs text-muted-foreground font-medium">{apt.patient?.rut || apt.patient?.email}</div>
                      </div>
                    </div>
                  </TableCell>
                )}
                
                <TableCell>
                  <div className="font-semibold flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    {apt.service?.name || "Servicio Personalizado"}
                  </div>
                  {apt.price != null && (
                    <div className="text-xs text-muted-foreground mt-1 font-medium bg-muted/50 w-max px-2 py-0.5 rounded-md">
                      ${apt.price.toLocaleString("es-CL")}
                    </div>
                  )}
                </TableCell>

                <TableCell>
                  <StatusBadge status={apt.status} />
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <WhatsappButton phone={apt.patient?.phone} message={reminderMessage(apt)} iconOnly />
                    <AppointmentStatusActions
                      appointmentId={apt.id}
                      currentStatus={apt.status}
                      loyaltyPoints={apt.service?.loyalty_points_earned}
                    />
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </motion.tbody>
        </Table>
      </div>
    </>
  )
}
