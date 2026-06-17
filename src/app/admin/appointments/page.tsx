"use client"

import { useState } from "react"
import { AppointmentList } from "@/components/admin/appointments/AppointmentList"
import { AppointmentCalendar } from "@/components/admin/appointments/AppointmentCalendar"
import { PageHeader } from "@/components/admin/PageHeader"
import { Button } from "@/components/ui/button"
import { Plus, Calendar as CalendarIcon, List as ListIcon } from "lucide-react"
import Link from "next/link"

export default function AppointmentsPage() {
  const [view, setView] = useState<"list" | "calendar">("calendar")

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

        <Link href="/admin/appointments/new">
          <Button className="bg-brand text-white hover:bg-brand-dark rounded-xl shadow-glow">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Cita
          </Button>
        </Link>
      </PageHeader>

      {view === "list" ? (
        <AppointmentList />
      ) : (
        <AppointmentCalendar />
      )}
    </div>
  )
}

