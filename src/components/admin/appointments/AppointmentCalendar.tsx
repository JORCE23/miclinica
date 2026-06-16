"use client"

import { Calendar, dateFnsLocalizer, ToolbarProps, View, Views } from "react-big-calendar"
import { format, parse, startOfWeek, getDay } from "date-fns"
import { es } from "date-fns/locale"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { useRouter } from "next/navigation"
import { useAppointments } from "@/hooks/useAppointments"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react"
import { useState } from "react"

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

// Custom Event Component for a professional look
const CustomEvent = ({ event }: any) => {
  return (
    <div className="flex flex-col h-full overflow-hidden p-1">
      <div className="font-bold text-[11px] leading-tight truncate">
        {event.patientName}
      </div>
      <div className="text-[10px] opacity-80 leading-tight truncate flex items-center gap-1 mt-0.5">
        <Clock className="w-2.5 h-2.5 inline-block shrink-0" />
        {format(event.start, "HH:mm")} - {event.serviceName}
      </div>
    </div>
  )
}

// Custom Toolbar Component
const CustomToolbar = (toolbar: ToolbarProps) => {
  const goToBack = () => toolbar.onNavigate('PREV')
  const goToNext = () => toolbar.onNavigate('NEXT')
  const goToCurrent = () => toolbar.onNavigate('TODAY')
  
  const label = () => {
    const date = format(toolbar.date, 'MMMM yyyy', { locale: es })
    return date.charAt(0).toUpperCase() + date.slice(1)
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-2">
        <button
          onClick={goToCurrent}
          className="px-4 h-9 bg-card border border-border/70 text-slate-700 font-medium text-sm rounded-xl hover:border-brand/40 hover:text-brand-dark transition-colors shadow-soft"
        >
          Hoy
        </button>
        <div className="flex items-center gap-1 bg-card border border-border/70 rounded-xl shadow-soft p-1">
          <button onClick={goToBack} className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-muted hover:text-brand-dark transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={goToNext} className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-muted hover:text-brand-dark transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <h2 className="font-display text-xl font-semibold text-slate-800 tracking-tight flex items-center gap-2">
        <CalendarIcon className="w-5 h-5 text-brand" />
        {label()}
      </h2>

      <div className="flex items-center gap-1 bg-muted/60 rounded-xl p-1 text-sm font-medium">
        {['month', 'week', 'day', 'agenda'].map((view) => (
          <button
            key={view}
            onClick={() => toolbar.onView(view as any)}
            className={`px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              toolbar.view === view
                ? "bg-card text-brand-dark shadow-soft"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {view === 'month' ? 'Mes' : view === 'week' ? 'Semana' : view === 'day' ? 'Día' : 'Agenda'}
          </button>
        ))}
      </div>
    </div>
  )
}

export function AppointmentCalendar() {
  const router = useRouter()
  const { data: appointments, isLoading } = useAppointments()
  
  const [view, setView] = useState<View>(Views.WEEK)
  const [date, setDate] = useState(new Date())

  if (isLoading) {
    return <div className="p-12 text-center text-muted-foreground animate-pulse">Cargando calendario interactivo...</div>
  }

  const events = (appointments || []).map((apt) => ({
    id: apt.id,
    patientName: apt.patient?.full_name || 'Paciente sin nombre',
    serviceName: apt.service?.name || 'Servicio general',
    start: new Date(apt.scheduled_at),
    end: new Date(new Date(apt.scheduled_at).getTime() + apt.duration_minutes * 60000),
    status: apt.status,
  }))

  const eventStyleGetter = (event: any) => {
    // Pastel colors for a clean, pro look
    let backgroundColor = "#f1f5f9" // slate-100 (pendiente)
    let borderColor = "#64748b" // slate-500
    let color = "#334155" // slate-700
    
    switch (event.status) {
      case "confirmada":
        backgroundColor = "#e0f2fe" // sky-100
        borderColor = "#0ea5e9" // sky-500
        color = "#0369a1" // sky-700
        break
      case "completada":
        backgroundColor = "#dcfce7" // green-100
        borderColor = "#22c55e" // green-500
        color = "#15803d" // green-700
        break
      case "cancelada":
        backgroundColor = "#fee2e2" // red-100
        borderColor = "#ef4444" // red-500
        color = "#b91c1c" // red-700
        break
      case "no_asistio":
        backgroundColor = "#ffedd5" // orange-100
        borderColor = "#f97316" // orange-500
        color = "#c2410c" // orange-700
        break
    }

    return {
      style: {
        backgroundColor,
        color,
        border: "none",
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: "8px",
        opacity: 1,
        boxShadow: "0 1px 3px 0 rgba(16, 36, 57, 0.08)",
      },
    }
  }

  // Horario fijo de la agenda: 08:00 a 22:00
  const minTime = new Date()
  minTime.setHours(8, 0, 0)

  const maxTime = new Date()
  maxTime.setHours(22, 0, 0)

  return (
    <div className="h-[600px] w-full bg-card rounded-2xl shadow-soft border border-border/70 p-4 md:p-6 calendar-container">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        culture="es"
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        min={minTime}
        max={maxTime}
        step={30}
        timeslots={1}
        components={{
          event: CustomEvent,
          toolbar: CustomToolbar,
        }}
        messages={{
          noEventsInRange: "No hay citas programadas para este periodo.",
          showMore: (total) => `+${total} más`,
        }}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={(event) => router.push(`/admin/appointments/${event.id}`)}
      />
    </div>
  )
}
