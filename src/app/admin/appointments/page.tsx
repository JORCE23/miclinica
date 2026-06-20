"use client"

import { useState } from "react"
import { AppointmentList } from "@/components/admin/appointments/AppointmentList"
import { WeekAgendaGrid } from "@/components/admin/appointments/WeekAgendaGrid"
import { PageHeader } from "@/components/admin/PageHeader"
import { Button } from "@/components/ui/button"
import { Plus, Calendar as CalendarIcon, List as ListIcon } from "lucide-react"
import { useAdminModals } from "@/components/admin/AdminModals"

export default function AppointmentsPage() {
  const [view, setView] = useState<"list" | "calendar">("calendar")
  const { openAppointment } = useAdminModals()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reservas y Citas"
        description="Gestiona la agenda de la clínica, confirma asistencias y asigna puntos."
        icon={CalendarIcon}
      >
        {/* Toggle entre vista lista y calendario */}
        <div className="flex items-center gap-1 rounded-full border border-border bg-muted p-1 mr-1">
          <button
            onClick={() => setView("list")}
            title="Vista de lista"
            className={`h-8 w-8 flex items-center justify-center rounded-full transition-colors ${
              view === "list" ? "bg-brand text-white shadow-soft" : "text-muted-foreground hover:text-foreground hover:bg-background"
            }`}
          >
            <ListIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("calendar")}
            title="Vista de calendario"
            className={`h-8 w-8 flex items-center justify-center rounded-full transition-colors ${
              view === "calendar" ? "bg-brand text-white shadow-soft" : "text-muted-foreground hover:text-foreground hover:bg-background"
            }`}
          >
            <CalendarIcon className="h-4 w-4" />
          </button>
        </div>

        <Button onClick={() => openAppointment()} className="bg-brand text-white hover:bg-brand-dark rounded-xl shadow-glow">
          <Plus className="mr-2 h-4 w-4" />
          Nueva Cita
        </Button>
      </PageHeader>

      {view === "list" ? (
        <AppointmentList />
      ) : (
        <WeekAgendaGrid />
      )}
    </div>
  )
}

