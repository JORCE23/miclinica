"use client"

import { useState } from "react"
import { AppointmentList } from "@/components/admin/appointments/AppointmentList"
import { AppointmentCalendar } from "@/components/admin/appointments/AppointmentCalendar"
import { PageHeader } from "@/components/admin/PageHeader"
import { Button } from "@/components/ui/button"
import { Plus, Calendar as CalendarIcon, List as ListIcon } from "lucide-react"
import Link from "next/link"

export default function AppointmentsPage() {
  const [view, setView] = useState<"list" | "calendar">("list")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reservas y Citas"
        description="Gestiona la agenda de la clínica, confirma asistencias y asigna puntos."
        icon={CalendarIcon}
      >
        {/* Opcional: Toggle entre vista lista y calendario (placeholder por ahora) */}
        <div className="flex items-center space-x-1 rounded-xl border border-white/15 bg-white/10 p-1 mr-1">
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("list")}
            className={view === "list" ? "h-8 px-2" : "h-8 px-2 text-white/70 hover:text-white hover:bg-white/10"}
          >
            <ListIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "calendar" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("calendar")}
            className={view === "calendar" ? "h-8 px-2" : "h-8 px-2 text-white/70 hover:text-white hover:bg-white/10"}
            title="Vista de calendario"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
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

