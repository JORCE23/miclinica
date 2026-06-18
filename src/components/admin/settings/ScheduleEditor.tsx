"use client"

import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Clock } from "lucide-react"

type Day = { day_of_week: number; is_open: boolean; open_time: string; close_time: string }
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
    </div>
  )
}
