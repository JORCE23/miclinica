"use client"

import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Clock, Ban, Trash2, Plus } from "lucide-react"

type Day = { day_of_week: number; is_open: boolean; open_time: string; close_time: string }
type Block = { id: string; day_of_week: number | null; block_date: string | null; start_time: string; end_time: string; reason: string | null }
const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
const timeCls = "h-9 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-brand"

export function ScheduleEditor() {
  const [days, setDays] = useState<Day[]>([])
  const [saving, setSaving] = useState(false)

  const { data } = useQuery<Day[]>({
    queryKey: ["clinic_schedule"],
    queryFn: async () => { const r = await fetch("/api/settings/schedule"); return r.ok ? r.json() : [] },
  })
  useEffect(() => { if (data) setDays(data) }, [data])

  const update = (dow: number, patch: Partial<Day>) =>
    setDays((ds) => ds.map((d) => (d.day_of_week === dow ? { ...d, ...patch } : d)))

  const save = async () => {
    setSaving(true)
    try {
      const r = await fetch("/api/settings/schedule", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule: days }),
      })
      if (!r.ok) throw new Error()
      toast.success("Horarios guardados")
    } catch { toast.error("No se pudieron guardar") }
    finally { setSaving(false) }
  }

  // Orden Lunes→Domingo para mostrar
  const ordered = [1, 2, 3, 4, 5, 6, 0].map((d) => days.find((x) => x.day_of_week === d)).filter(Boolean) as Day[]

  return (
    <div className="rounded-2xl border border-border/70 bg-card shadow-soft">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <Clock className="h-5 w-5 text-brand" />
        <div>
          <h2 className="text-base font-semibold text-foreground">Horarios de atención</h2>
          <p className="text-xs text-muted-foreground">Habilita los días y las horas en que se puede reservar online.</p>
        </div>
      </div>
      <div className="p-5 space-y-2.5">
        {ordered.map((d) => (
          <div key={d.day_of_week} className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2.5 w-40">
              <Switch checked={d.is_open} onCheckedChange={(v) => update(d.day_of_week, { is_open: v })} />
              <span className={`text-sm font-medium ${d.is_open ? "text-foreground" : "text-muted-foreground"}`}>{DAY_NAMES[d.day_of_week]}</span>
            </div>
            {d.is_open ? (
              <div className="flex items-center gap-2">
                <input type="time" value={d.open_time} onChange={(e) => update(d.day_of_week, { open_time: e.target.value })} className={timeCls} />
                <span className="text-muted-foreground text-sm">a</span>
                <input type="time" value={d.close_time} onChange={(e) => update(d.day_of_week, { close_time: e.target.value })} className={timeCls} />
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Cerrado</span>
            )}
          </div>
        ))}
        <div className="flex justify-end pt-2">
          <Button onClick={save} disabled={saving} className="bg-brand text-white hover:bg-brand-dark rounded-xl">
            {saving ? "Guardando…" : "Guardar horarios"}
          </Button>
        </div>
      </div>

      <ScheduleBlocks />
    </div>
  )
}

// Bloqueos: desactivar rangos de horas dentro de un día. No aparecen al reservar
// online y se ven bloqueados en el calendario del admin.
function ScheduleBlocks() {
  const qc = useQueryClient()
  const [kind, setKind] = useState<"weekly" | "date">("weekly")
  const [dow, setDow] = useState(1)
  const [blockDate, setBlockDate] = useState("")
  const [startTime, setStartTime] = useState("12:00")
  const [endTime, setEndTime] = useState("14:00")
  const [reason, setReason] = useState("")
  const [adding, setAdding] = useState(false)

  const { data: blocks = [] } = useQuery<Block[]>({
    queryKey: ["schedule_blocks"],
    queryFn: async () => { const r = await fetch("/api/settings/schedule-blocks"); return r.ok ? r.json() : [] },
  })

  const add = async () => {
    if (endTime <= startTime) { toast.error("La hora de término debe ser posterior a la de inicio"); return }
    if (kind === "date" && !blockDate) { toast.error("Elige una fecha"); return }
    setAdding(true)
    try {
      const r = await fetch("/api/settings/schedule-blocks", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          day_of_week: kind === "weekly" ? dow : undefined,
          block_date: kind === "date" ? blockDate : undefined,
          start_time: startTime, end_time: endTime, reason: reason || undefined,
        }),
      })
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || "Error") }
      toast.success("Bloqueo agregado")
      setReason("")
      qc.invalidateQueries({ queryKey: ["schedule_blocks"] })
    } catch (e: any) { toast.error(e.message) }
    finally { setAdding(false) }
  }

  const remove = async (id: string) => {
    const r = await fetch(`/api/settings/schedule-blocks?id=${id}`, { method: "DELETE" })
    if (r.ok) { toast.success("Bloqueo eliminado"); qc.invalidateQueries({ queryKey: ["schedule_blocks"] }) }
    else toast.error("No se pudo eliminar")
  }

  const label = (b: Block) =>
    b.block_date
      ? `${b.block_date.split("-").reverse().join("/")} · ${b.start_time}–${b.end_time}`
      : `${DAY_NAMES[b.day_of_week ?? 0]} · ${b.start_time}–${b.end_time}`

  return (
    <div className="border-t border-border">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <Ban className="h-5 w-5 text-brand" />
        <div>
          <h2 className="text-base font-semibold text-foreground">Bloqueos de horario</h2>
          <p className="text-xs text-muted-foreground">Desactiva rangos de horas (ej. 12:00–14:00). No aparecen al reservar online ni en tu agenda.</p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Formulario para agregar */}
        <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-3">
          <div className="flex gap-2">
            <button onClick={() => setKind("weekly")} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${kind === "weekly" ? "bg-brand text-white border-brand" : "border-border text-muted-foreground hover:border-brand/40"}`}>Cada semana</button>
            <button onClick={() => setKind("date")} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${kind === "date" ? "bg-brand text-white border-brand" : "border-border text-muted-foreground hover:border-brand/40"}`}>Una fecha</button>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            {kind === "weekly" ? (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Día</label>
                <select value={dow} onChange={(e) => setDow(Number(e.target.value))} className={timeCls}>
                  {[1, 2, 3, 4, 5, 6, 0].map((d) => <option key={d} value={d}>{DAY_NAMES[d]}</option>)}
                </select>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Fecha</label>
                <input type="date" value={blockDate} onChange={(e) => setBlockDate(e.target.value)} className={timeCls} />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Desde</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={timeCls} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Hasta</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={timeCls} />
            </div>
            <div className="space-y-1 flex-1 min-w-[140px]">
              <label className="text-xs text-muted-foreground">Motivo (opcional)</label>
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej. colación, reunión…" className={`${timeCls} w-full`} />
            </div>
            <Button onClick={add} disabled={adding} className="bg-brand text-white hover:bg-brand-dark rounded-xl h-9">
              <Plus className="h-4 w-4 mr-1" /> Agregar
            </Button>
          </div>
        </div>

        {/* Lista de bloqueos */}
        {blocks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">No hay bloqueos. Todo el horario de atención está disponible.</p>
        ) : (
          <div className="space-y-2">
            {blocks.map((b) => (
              <div key={b.id} className="flex items-center gap-3 rounded-xl border border-border/70 px-3 py-2">
                <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-500 shrink-0">
                  <Ban className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{label(b)}</p>
                  {b.reason && <p className="text-xs text-muted-foreground truncate">{b.reason}</p>}
                  {!b.block_date && <p className="text-[11px] text-muted-foreground">Se repite todas las semanas</p>}
                </div>
                <button onClick={() => remove(b.id)} className="h-8 w-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
