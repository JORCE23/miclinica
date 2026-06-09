"use client"

import { useState } from "react"
import { AppointmentList } from "@/components/admin/appointments/AppointmentList"
import { AppointmentCalendar } from "@/components/admin/appointments/AppointmentCalendar"
import { Button } from "@/components/ui/button"
import { Plus, Calendar as CalendarIcon, List as ListIcon } from "lucide-react"
import Link from "next/link"

export default function AppointmentsPage() {
  const [view, setView] = useState<"list" | "calendar">("list")

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Reservas y Citas</h1>
          <p className="text-muted-foreground">
            Gestiona la agenda de la clínica, confirma asistencias y asigna puntos.
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Opcional: Toggle entre vista lista y calendario (placeholder por ahora) */}
          <div className="flex items-center space-x-1 rounded-md border p-1 mr-2 bg-background">
            <Button 
              variant={view === "list" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setView("list")}
              className="h-8 px-2"
            >
              <ListIcon className="h-4 w-4" />
            </Button>
            <Button 
              variant={view === "calendar" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setView("calendar")}
              className="h-8 px-2"
              title="Vista de calendario"
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </div>

          <Link href="/admin/appointments/new">
            <Button className="bg-rose-600 hover:bg-rose-700">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Cita
            </Button>
          </Link>
        </div>
      </div>

      {view === "list" ? (
        <AppointmentList />
      ) : (
        <AppointmentCalendar />
      )}
    </div>
  )
}
