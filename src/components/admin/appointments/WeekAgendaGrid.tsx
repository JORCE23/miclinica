"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAppointments } from "@/hooks/useAppointments"
import { format, addDays, startOfDay, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import { Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

// Horas visibles (sin scroll): 08:00 a 20:00, por hora.
const HOURS = Array.from({ length: 13 }, (_, i) => `${String(i + 8).padStart(2, "0")}:00`)

const STATUS_DOT: Record<string, string> = {
  confirmada: "bg-emerald-500",
  completada: "bg-blue-500",
  pendiente: "bg-amber-500",
  cancelada: "bg-red-500",
  no_asistio: "bg-orange-500",
}

export function WeekAgendaGrid() {
  const router = useRouter()
  const { data: appointments, isLoading } = useAppointments()
  const [weekStart, setWeekStart] = useState<Date>(() => startOfDay(new Date()))

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Altura de cada fila de hora (px) — el bloque de la cita crece con la duración.
  const ROW_H = 54
  const spanOf = (a: any) => Math.max(1, Math.round((a.duration_minutes || 60) / 60)) // eslint-disable-line @typescript-eslint/no-explicit-any

  // Cita que EMPIEZA en (día, hora).
  const apptStartingAt = (day: Date, hour: string) => {
    const h = parseInt(hour, 10)
    return (appointments || []).find((a) => {
      const d = new Date(a.scheduled_at)
      return isSameDay(d, day) && d.getHours() === h
    })
  }

  // ¿La celda (día, hora) está cubierta por una cita que empezó antes y dura varias horas?
  const coveredAt = (day: Date, hour: string) => {
    const h = parseInt(hour, 10)
    return (appointments || []).some((a) => {
      const d = new Date(a.scheduled_at)
      if (!isSameDay(d, day)) return false
      const sh = d.getHours()
      return sh < h && sh + spanOf(a) > h
    })
  }

  const goCreate = (day: Date, hour: string) => {
    const dt = `${format(day, "yyyy-MM-dd")}T${hour}`
    router.push(`/admin/appointments/new?scheduled_at=${encodeURIComponent(dt)}`)
  }

  const cols = "64px repeat(7, minmax(96px, 1fr))"

  return (
    <div className="rounded-2xl border border-border/70 bg-card shadow-soft overflow-hidden">
      {/* Navegación de semana */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
        <h2 className="font-display text-xl font-semibold text-foreground capitalize">
          {format(weekStart, "d 'de' MMMM", { locale: es })}
          <span className="text-muted-foreground"> – {format(addDays(weekStart, 6), "d 'de' MMMM", { locale: es })}</span>
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setWeekStart(startOfDay(new Date()))}
            className="h-8 px-3 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Hoy
          </button>
          <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
            <button onClick={() => setWeekStart((d) => addDays(d, -7))} className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setWeekStart((d) => addDays(d, 7))} className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground animate-pulse">Cargando agenda…</div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            {/* Encabezado de días */}
            <div className="grid sticky top-0 z-10 bg-card border-b border-border" style={{ gridTemplateColumns: cols }}>
              <div />
              {days.map((d, i) => {
                const today = isSameDay(d, new Date())
                return (
                  <div key={i} className={cn("text-center py-2.5 border-l border-border/60", today && "bg-brand/[0.04]")}>
                    <div className={cn("text-[10px] font-medium uppercase tracking-wide", today ? "text-brand" : "text-muted-foreground")}>
                      {format(d, "EEE", { locale: es })}
                    </div>
                    <div className={cn("font-display text-lg leading-tight", today ? "text-brand" : "text-foreground")}>
                      {format(d, "d")}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Filas de horas */}
            {HOURS.map((hour) => (
              <div key={hour} className="grid border-b border-border/50 last:border-b-0" style={{ gridTemplateColumns: cols }}>
                <div className="flex items-start justify-end pr-2 pt-1.5 text-[11px] text-muted-foreground" style={{ height: ROW_H }}>{hour}</div>
                {days.map((day, di) => {
                  const a = apptStartingAt(day, hour)
                  const covered = !a && coveredAt(day, hour)
                  const today = isSameDay(day, new Date())
                  const dur = a?.duration_minutes || 60
                  return (
                    <div key={di} className={cn("relative border-l border-border/50 p-1", today && "bg-brand/[0.03]")} style={{ height: ROW_H }}>
                      {a ? (
                        <button
                          onClick={() => router.push(`/admin/appointments/${a.id}`)}
                          style={{ position: "absolute", top: 3, left: 3, right: 3, height: spanOf(a) * ROW_H - 6, zIndex: 10 }}
                          className="text-left rounded-lg bg-brand/10 border-l-[3px] border-brand px-2 py-1 hover:bg-brand/15 transition-colors overflow-hidden shadow-sm"
                          title={`${a.patient?.full_name || "Paciente"} · ${a.service?.name || ""} · ${dur} min`}
                        >
                          <div className="flex items-center gap-1">
                            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", STATUS_DOT[a.status] || "bg-muted-foreground")} />
                            <span className="text-[11px] font-medium text-foreground truncate">{a.patient?.full_name || "Paciente"}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">{format(new Date(a.scheduled_at), "HH:mm")} · {a.service?.name || "Servicio"}</div>
                          <div className="text-[9.5px] font-semibold text-brand mt-0.5">{dur} min</div>
                        </button>
                      ) : covered ? null : (
                        <button
                          onClick={() => goCreate(day, hour)}
                          title="Agendar"
                          className="group w-full h-full rounded-lg flex items-center justify-center hover:bg-emerald-500/[0.07] transition-colors"
                        >
                          <span className="h-6 w-6 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center opacity-70 group-hover:opacity-100 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                            <Plus className="h-3.5 w-3.5" />
                          </span>
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="px-4 py-2.5 text-[11px] text-muted-foreground border-t border-border">
        Toca el <span className="text-emerald-600 font-semibold">+</span> de un horario libre para agendar. Toca una cita para verla o editarla.
      </p>
    </div>
  )
}
