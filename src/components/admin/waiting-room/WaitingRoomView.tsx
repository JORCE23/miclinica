"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { PageHeader } from "@/components/admin/PageHeader"
import { DoorOpen, Clock, LogIn, UserCheck, CheckCircle2, ArrowRight } from "lucide-react"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Appt = { id: string; scheduled_at: string; status: string; arrival_status: string | null; patient: any; service: any }

type ColKey = "por_llegar" | "esperando" | "en_atencion" | "finalizado"

const COLUMNS: { key: ColKey; label: string; icon: typeof Clock; color: string; next?: ColKey; nextLabel?: string }[] = [
  { key: "por_llegar", label: "Por llegar", icon: Clock, color: "text-slate-500", next: "esperando", nextLabel: "Marcar llegada" },
  { key: "esperando", label: "En espera", icon: LogIn, color: "text-amber-600", next: "en_atencion", nextLabel: "Pasar a atención" },
  { key: "en_atencion", label: "En atención", icon: UserCheck, color: "text-brand", next: "finalizado", nextLabel: "Finalizar" },
  { key: "finalizado", label: "Finalizado", icon: CheckCircle2, color: "text-emerald-600" },
]

export function WaitingRoomView() {
  const qc = useQueryClient()
  const { data: appts = [], isLoading } = useQuery<Appt[]>({
    queryKey: ["waiting-room"],
    queryFn: async () => {
      const r = await fetch("/api/waiting-room")
      if (!r.ok) throw new Error("Error al cargar")
      return r.json()
    },
    refetchInterval: 30000, // refresca cada 30s
  })

  const colOf = (a: Appt): ColKey => {
    if (a.status === "completada") return "finalizado"
    if (a.arrival_status === "esperando") return "esperando"
    if (a.arrival_status === "en_atencion") return "en_atencion"
    if (a.arrival_status === "finalizado") return "finalizado"
    return "por_llegar"
  }

  const move = async (a: Appt, to: ColKey) => {
    const r = await fetch(`/api/appointments/${a.id}/arrival`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ arrival_status: to }),
    })
    if (!r.ok) { toast.error("No se pudo actualizar"); return }
    qc.invalidateQueries({ queryKey: ["waiting-room"] })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Sala de espera"
        description={`Pacientes de hoy, ${format(new Date(), "EEEE d 'de' MMMM", { locale: es })}. Actualiza el estado a medida que llegan y se atienden.`}
        icon={DoorOpen}
      />

      {isLoading ? (
        <div className="rounded-2xl border border-border/70 bg-card shadow-soft p-10 text-center text-muted-foreground">Cargando...</div>
      ) : appts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
          <DoorOpen className="h-8 w-8 text-slate-300 mx-auto mb-3" />
          <p className="text-muted-foreground">No hay citas para hoy.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const items = appts.filter((a) => colOf(a) === col.key)
            return (
              <div key={col.key} className="rounded-2xl border border-border/70 bg-card shadow-soft flex flex-col min-h-[200px]">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/70">
                  <div className="flex items-center gap-2">
                    <col.icon className={`h-4 w-4 ${col.color}`} />
                    <h2 className="font-semibold text-sm text-slate-800">{col.label}</h2>
                  </div>
                  <span className="h-6 min-w-6 px-1.5 rounded-full bg-muted text-xs font-bold text-muted-foreground flex items-center justify-center">{items.length}</span>
                </div>
                <div className="flex-1 p-3 space-y-2.5">
                  {items.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">—</p>}
                  {items.map((a) => (
                    <div key={a.id} className="rounded-xl border border-border/70 bg-background p-3 hover-lift hover:shadow-soft">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800 truncate">{a.patient?.full_name || "Paciente"}</p>
                        <span className="text-xs font-medium text-brand-dark shrink-0">{format(new Date(a.scheduled_at), "HH:mm")}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{a.service?.name || "Servicio"}</p>
                      {col.next && (
                        <button
                          onClick={() => move(a, col.next!)}
                          className="mt-2.5 w-full flex items-center justify-center gap-1.5 h-8 rounded-lg bg-brand-soft text-brand-dark text-xs font-medium hover:bg-brand hover:text-white transition-colors"
                        >
                          {col.nextLabel} <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
