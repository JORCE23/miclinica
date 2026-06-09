"use client"

import { Calendar, dateFnsLocalizer } from "react-big-calendar"
import { format, parse, startOfWeek, getDay } from "date-fns"
import es from "date-fns/locale/es"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { Appointment } from "@/types"
import { useRouter } from "next/navigation"
import { useAppointments } from "@/hooks/useAppointments"

const locales = {
  es: es,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

export function AppointmentCalendar() {
  const router = useRouter()
  const { data: appointments, isLoading } = useAppointments()

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando calendario...</div>
  }

  const events = (appointments || []).map((apt) => ({
    id: apt.id,
    title: `${apt.patient?.full_name || 'Paciente'} - ${apt.service?.name || 'Servicio'}`,
    start: new Date(apt.scheduled_at),
    end: new Date(new Date(apt.scheduled_at).getTime() + apt.duration_minutes * 60000),
    status: apt.status,
  }))

  const eventStyleGetter = (event: any) => {
    let backgroundColor = "#64748b" // slate-500 (pendiente)
    
    switch (event.status) {
      case "confirmada":
        backgroundColor = "#3b82f6" // blue-500
        break
      case "completada":
        backgroundColor = "#22c55e" // green-500
        break
      case "cancelada":
        backgroundColor = "#ef4444" // red-500
        break
      case "no_asistio":
        backgroundColor = "#f97316" // orange-500
        break
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        border: "none",
        display: "block",
      },
    }
  }

  // Restrict calendar times between 08:00 and 20:00
  const minTime = new Date()
  minTime.setHours(8, 0, 0)
  
  const maxTime = new Date()
  maxTime.setHours(20, 0, 0)

  return (
    <div className="h-[650px] w-full bg-card border rounded-md p-4">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        culture="es"
        defaultView="week"
        min={minTime}
        max={maxTime}
        messages={{
          next: "Sig",
          previous: "Ant",
          today: "Hoy",
          month: "Mes",
          week: "Semana",
          day: "Día",
          agenda: "Agenda",
          date: "Fecha",
          time: "Hora",
          event: "Cita",
          noEventsInRange: "No hay citas en este rango.",
        }}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={(event) => router.push(`/admin/appointments/${event.id}`)}
      />
    </div>
  )
}
