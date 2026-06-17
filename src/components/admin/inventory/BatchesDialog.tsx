"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { X, Plus, Trash2, CalendarClock } from "lucide-react"

type Batch = { id: string; batch_code: string | null; quantity: number; expiry_date: string | null }

const inputCls =
  "w-full h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none transition-all focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/15"

function statusOf(expiry: string | null) {
  if (!expiry) return { label: "Sin fecha", cls: "bg-muted text-muted-foreground" }
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d = new Date(expiry + "T00:00:00")
  const days = Math.round((d.getTime() - today.getTime()) / 86400000)
  if (days < 0) return { label: "Vencido", cls: "bg-red-100 text-red-700" }
  if (days <= 30) return { label: `Vence en ${days}d`, cls: "bg-amber-100 text-amber-700" }
  return { label: "Vigente", cls: "bg-emerald-100 text-emerald-700" }
}

export function BatchesDialog({
  productId,
  productName,
  onClose,
  onChanged,
}: {
  productId: string
  productName: string
  onClose: () => void
  onChanged?: () => void
}) {
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState("")
  const [qty, setQty] = useState("")
  const [expiry, setExpiry] = useState("")

  const load = async () => {
    const r = await fetch(`/api/inventory/${productId}/batches`)
    if (r.ok) setBatches(await r.json())
    setLoading(false)
  }

  useEffect(() => { load() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [productId])

  const add = async () => {
    if (!expiry) { toast.error("Indica la fecha de vencimiento"); return }
    const r = await fetch(`/api/inventory/${productId}/batches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batch_code: code, quantity: Number(qty) || 0, expiry_date: expiry }),
    })
    if (!r.ok) { toast.error("No se pudo agregar el lote"); return }
    setCode(""); setQty(""); setExpiry("")
    load(); onChanged?.()
  }

  const remove = async (id: string) => {
    const r = await fetch(`/api/inventory/batches?id=${id}`, { method: "DELETE" })
    if (!r.ok) { toast.error("No se pudo eliminar"); return }
    load(); onChanged?.()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-card rounded-2xl shadow-elevated border border-border/70 p-4 sm:p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-brand" /> Lotes y vencimientos
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <p className="text-sm text-muted-foreground mb-5">{productName}</p>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground text-sm">Cargando...</div>
        ) : (
          <div className="space-y-2 mb-5">
            {batches.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4 border border-dashed border-border rounded-xl">
                Sin lotes registrados.
              </p>
            )}
            {batches.map((b) => {
              const st = statusOf(b.expiry_date)
              return (
                <div key={b.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/70 bg-background">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{b.batch_code || "Lote sin código"} · {b.quantity} u.</p>
                    <p className="text-xs text-muted-foreground">{b.expiry_date ? new Date(b.expiry_date + "T00:00:00").toLocaleDateString("es-CL") : "Sin fecha"}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                    <button onClick={() => remove(b.id)} className="h-8 w-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border">
          <div className="col-span-2 sm:col-span-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Código de lote</label>
            <input value={code} onChange={(e) => setCode(e.target.value)} className={inputCls} placeholder="L-2026-01" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Cantidad</label>
            <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Vence</label>
            <input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className={inputCls} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cerrar</Button>
          <Button onClick={add} className="bg-brand text-white hover:bg-brand-dark rounded-xl shadow-glow">
            <Plus className="h-4 w-4 mr-2" /> Agregar lote
          </Button>
        </div>
      </div>
    </div>
  )
}
