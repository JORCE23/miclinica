"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { PageHeader } from "@/components/admin/PageHeader"
import { Button } from "@/components/ui/button"
import {
  Wallet, ArrowDownCircle, ArrowUpCircle, Plus, Trash2, X, Receipt, CalendarCheck, Scale,
} from "lucide-react"

type Movement = { id: string; type: "ingreso" | "egreso"; amount: number; method: string | null; concept: string | null; created_at: string }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApptIncome = { id: string; price: number | null; payment_method: string | null; scheduled_at: string; patient: any; service: any }

const clp = (n: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n || 0)
const METHODS = ["Efectivo", "Débito", "Crédito", "Transferencia"]

export function CashRegisterView() {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [showClose, setShowClose] = useState(false)
  const [form, setForm] = useState({ type: "ingreso", amount: "", method: "Efectivo", concept: "" })

  const { data, isLoading } = useQuery<{ movements: Movement[]; appointments: ApptIncome[] }>({
    queryKey: ["cash"],
    queryFn: async () => {
      const r = await fetch("/api/cash")
      if (!r.ok) throw new Error("Error al cargar la caja")
      return r.json()
    },
  })

  const refresh = () => qc.invalidateQueries({ queryKey: ["cash"] })

  const movements = data?.movements || []
  const appts = data?.appointments || []

  const apptIncome = appts.reduce((acc, a) => acc + (a.price || 0), 0)
  const manualIn = movements.filter((m) => m.type === "ingreso").reduce((a, m) => a + Number(m.amount), 0)
  const egresos = movements.filter((m) => m.type === "egreso").reduce((a, m) => a + Number(m.amount), 0)
  const ingresos = apptIncome + manualIn
  const balance = ingresos - egresos

  // Desglose por método de pago (citas + ingresos manuales con método)
  const byMethod: Record<string, number> = {}
  for (const a of appts) { const k = a.payment_method || "Sin especificar"; byMethod[k] = (byMethod[k] || 0) + (a.price || 0) }
  for (const m of movements) if (m.type === "ingreso") { const k = m.method || "Sin especificar"; byMethod[k] = (byMethod[k] || 0) + Number(m.amount) }

  const addMovement = async () => {
    const amount = Number(form.amount)
    if (isNaN(amount) || amount <= 0) { toast.error("Monto inválido"); return }
    const r = await fetch("/api/cash", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (!r.ok) { toast.error("No se pudo registrar"); return }
    toast.success("Movimiento registrado")
    setShowAdd(false); setForm({ type: "ingreso", amount: "", method: "Efectivo", concept: "" })
    refresh()
  }

  const removeMovement = async (id: string) => {
    const r = await fetch(`/api/cash/${id}`, { method: "DELETE" })
    if (!r.ok) { toast.error("No se pudo eliminar"); return }
    refresh()
  }

  const cards = [
    { label: "Ingresos del día", value: clp(ingresos), icon: ArrowDownCircle, tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" },
    { label: "Egresos", value: clp(egresos), icon: ArrowUpCircle, tint: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400" },
    { label: "Balance", value: clp(balance), icon: Scale, tint: "bg-brand/10 text-brand" },
    { label: "Atenciones cobradas", value: appts.length, icon: CalendarCheck, tint: "bg-muted text-muted-foreground" },
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="Caja" description={`Resumen de caja de hoy, ${format(new Date(), "d 'de' MMMM", { locale: es })}.`} icon={Wallet}>
        <Button variant="outline" onClick={() => setShowClose(true)} className="rounded-xl">
          <Receipt className="h-4 w-4 mr-2" /> Cierre del día
        </Button>
        <Button onClick={() => { setForm({ ...form, type: "ingreso" }); setShowAdd(true) }} className="bg-brand text-white hover:bg-brand-dark rounded-xl shadow-glow">
          <Plus className="h-4 w-4 mr-2" /> Movimiento
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="rounded-2xl border border-border/70 bg-card shadow-soft p-4 flex items-center gap-3">
            <div className={`h-11 w-11 rounded-xl ${c.tint} flex items-center justify-center shrink-0`}>
              <c.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold truncate">{c.label}</p>
              <p className="text-xl font-bold text-foreground truncate">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Atenciones cobradas hoy */}
        <div className="lg:col-span-2 rounded-2xl border border-border/70 bg-card shadow-soft overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border/70"><h2 className="font-semibold text-foreground text-sm">Atenciones cobradas hoy</h2></div>
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Cargando...</div>
          ) : appts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Aún no hay atenciones completadas hoy.</div>
          ) : (
            <div className="divide-y divide-border/60">
              {appts.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.patient?.full_name || "Paciente"}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.service?.name || "Servicio"} · {a.payment_method || "Sin método"}</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 shrink-0">{clp(a.price || 0)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Movimientos manuales */}
          <div className="px-5 py-3.5 border-y border-border/70 bg-muted/30"><h2 className="font-semibold text-foreground text-sm">Movimientos manuales</h2></div>
          {movements.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">Sin movimientos manuales hoy.</div>
          ) : (
            <div className="divide-y divide-border/60">
              {movements.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {m.type === "ingreso"
                      ? <ArrowDownCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                      : <ArrowUpCircle className="h-5 w-5 text-red-500 shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{m.concept || (m.type === "ingreso" ? "Ingreso" : "Egreso")}</p>
                      <p className="text-xs text-muted-foreground">{m.method || "—"} · {format(new Date(m.created_at), "HH:mm")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-sm font-bold ${m.type === "ingreso" ? "text-emerald-600" : "text-red-600"}`}>
                      {m.type === "ingreso" ? "+" : "−"}{clp(Number(m.amount))}
                    </span>
                    <button onClick={() => removeMovement(m.id)} className="h-8 w-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desglose por método */}
        <div className="rounded-2xl border border-border/70 bg-card shadow-soft p-5 h-fit">
          <h2 className="font-semibold text-foreground text-sm mb-4">Ingresos por método</h2>
          <div className="space-y-3">
            {Object.keys(byMethod).length === 0 && <p className="text-sm text-muted-foreground">Sin ingresos aún.</p>}
            {Object.entries(byMethod).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{k}</span>
                <span className="text-sm font-semibold text-foreground">{clp(v)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Total ingresos</span>
            <span className="text-base font-bold text-brand-dark">{clp(ingresos)}</span>
          </div>
        </div>
      </div>

      {/* Modal agregar movimiento */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-md bg-card rounded-2xl shadow-elevated border border-border/70 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-xl font-semibold text-foreground">Nuevo movimiento</h3>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {(["ingreso", "egreso"] as const).map((t) => (
                <button key={t} onClick={() => setForm({ ...form, type: t })}
                  className={`py-2 rounded-xl text-sm font-medium border transition-all capitalize ${form.type === t ? "bg-brand-soft border-brand/30 text-brand-dark" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Monto</label>
                <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputCls} placeholder="0" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Método</label>
                <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className={inputCls}>
                  {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Concepto</label>
                <input value={form.concept} onChange={(e) => setForm({ ...form, concept: e.target.value })} className={inputCls} placeholder="Venta de producto, retiro, etc." />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowAdd(false)} className="rounded-xl">Cancelar</Button>
              <Button onClick={addMovement} className="bg-brand text-white hover:bg-brand-dark rounded-xl shadow-glow">Registrar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal cierre del día */}
      {showClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowClose(false)}>
          <div className="w-full max-w-sm bg-card rounded-2xl shadow-elevated border border-border/70 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-display text-xl font-semibold text-foreground">Cierre del día</h3>
              <button onClick={() => setShowClose(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-sm text-muted-foreground mb-5">{format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}</p>
            <div className="space-y-2.5">
              {Object.entries(byMethod).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm"><span className="text-muted-foreground">{k}</span><span className="font-medium text-foreground">{clp(v)}</span></div>
              ))}
              <div className="flex justify-between text-sm pt-2 border-t border-border"><span className="text-emerald-700">Ingresos</span><span className="font-semibold text-emerald-700">{clp(ingresos)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-red-700">Egresos</span><span className="font-semibold text-red-700">− {clp(egresos)}</span></div>
              <div className="flex justify-between text-base pt-2 border-t border-border"><span className="font-bold text-foreground">Balance final</span><span className="font-bold text-brand-dark">{clp(balance)}</span></div>
            </div>
            <Button onClick={() => setShowClose(false)} className="w-full mt-6 bg-brand text-white hover:bg-brand-dark rounded-xl">Cerrar</Button>
          </div>
        </div>
      )}
    </div>
  )
}

const inputCls =
  "w-full h-10 rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition-all focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/15"
