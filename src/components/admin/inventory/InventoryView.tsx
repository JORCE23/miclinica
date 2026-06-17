"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/PageHeader"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Package, Boxes, PackageX, AlertTriangle, Plus, Search, Pencil, Trash2,
  Minus, Layers, X, Save, TrendingDown, CalendarClock, History,
} from "lucide-react"
import { BatchesDialog } from "./BatchesDialog"

type Product = {
  id: string
  name: string
  category: string | null
  sku: string | null
  unit: string
  stock: number
  min_stock: number
  cost: number | null
  supplier: string | null
  notes: string | null
}

const clp = (n: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n || 0)

const emptyForm = {
  name: "", category: "", sku: "", unit: "unidad", stock: "0", min_stock: "5", cost: "", supplier: "", notes: "",
}

export function InventoryView() {
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"todos" | "bajo" | "agotado">("todos")

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)

  const [adjustFor, setAdjustFor] = useState<Product | null>(null)
  const [adjType, setAdjType] = useState<"entrada" | "salida" | "ajuste">("entrada")
  const [adjQty, setAdjQty] = useState("1")
  const [adjReason, setAdjReason] = useState("")
  const [batchFor, setBatchFor] = useState<Product | null>(null)

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["inventory"],
    queryFn: async () => {
      const r = await fetch("/api/inventory")
      if (!r.ok) throw new Error("Error al cargar inventario")
      return r.json()
    },
  })

  const { data: batchAlerts } = useQuery<{ expiredCount: number; expiringCount: number }>({
    queryKey: ["inventory-batches-alerts"],
    queryFn: async () => {
      const r = await fetch("/api/inventory/batches")
      return r.ok ? r.json() : { expiredCount: 0, expiringCount: 0 }
    },
  })

  const refresh = () => qc.invalidateQueries({ queryKey: ["inventory"] })
  const refreshBatches = () => qc.invalidateQueries({ queryKey: ["inventory-batches-alerts"] })

  const lowOf = (p: Product) => p.stock > 0 && p.stock <= p.min_stock
  const outOf = (p: Product) => p.stock <= 0

  const lowCount = products.filter(lowOf).length
  const outCount = products.filter(outOf).length
  const totalValue = products.reduce((acc, p) => acc + p.stock * (p.cost || 0), 0)

  const filtered = products
    .filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || "").toLowerCase().includes(search.toLowerCase())
    )
    .filter((p) => (filter === "bajo" ? lowOf(p) : filter === "agotado" ? outOf(p) : true))

  // --- acciones ---
  const openCreate = () => { setEditing(null); setForm({ ...emptyForm }); setShowForm(true) }
  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({
      name: p.name, category: p.category || "", sku: p.sku || "", unit: p.unit || "unidad",
      stock: String(p.stock), min_stock: String(p.min_stock), cost: p.cost ? String(p.cost) : "",
      supplier: p.supplier || "", notes: p.notes || "",
    })
    setShowForm(true)
  }

  const saveProduct = async () => {
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return }
    setSaving(true)
    try {
      const url = editing ? `/api/inventory/${editing.id}` : "/api/inventory"
      const method = editing ? "PUT" : "POST"
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      if (!r.ok) throw new Error()
      toast.success(editing ? "Producto actualizado" : "Producto creado")
      setShowForm(false)
      refresh()
    } catch { toast.error("No se pudo guardar") }
    finally { setSaving(false) }
  }

  const removeProduct = async (p: Product) => {
    if (!confirm(`¿Eliminar "${p.name}" del inventario?`)) return
    try {
      const r = await fetch(`/api/inventory/${p.id}`, { method: "DELETE" })
      if (!r.ok) throw new Error()
      toast.success("Producto eliminado")
      refresh()
    } catch { toast.error("No se pudo eliminar") }
  }

  const quickMove = async (p: Product, type: "entrada" | "salida") => {
    try {
      const r = await fetch(`/api/inventory/${p.id}/movement`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, quantity: 1 }),
      })
      if (!r.ok) throw new Error()
      refresh()
    } catch { toast.error("No se pudo actualizar el stock") }
  }

  const applyAdjust = async () => {
    if (!adjustFor) return
    const qty = Number(adjQty)
    if (isNaN(qty)) { toast.error("Cantidad inválida"); return }
    try {
      const r = await fetch(`/api/inventory/${adjustFor.id}/movement`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: adjType, quantity: qty, reason: adjReason }),
      })
      if (!r.ok) throw new Error()
      toast.success("Stock actualizado")
      setAdjustFor(null); setAdjQty("1"); setAdjReason("")
      refresh()
    } catch { toast.error("No se pudo ajustar el stock") }
  }

  const seedExamples = async () => {
    try {
      const r = await fetch("/api/inventory/seed", { method: "POST" })
      if (!r.ok) throw new Error()
      toast.success("Productos de ejemplo cargados")
      refresh()
    } catch { toast.error("No se pudieron cargar") }
  }

  const metricCards = [
    { label: "Productos", value: products.length, icon: Boxes, tint: "bg-brand/10 text-brand" },
    { label: "Stock bajo", value: lowCount, icon: TrendingDown, tint: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" },
    { label: "Agotados", value: outCount, icon: PackageX, tint: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400" },
    { label: "Por vencer", value: batchAlerts?.expiringCount ?? 0, icon: CalendarClock, tint: "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400" },
    { label: "Valor inventario", value: clp(totalValue), icon: Layers, tint: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400" },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inventario"
        description="Controla el stock de tus productos e insumos y recibe alertas cuando se agoten."
        icon={Package}
      >
        <Button variant="outline" render={<Link href="/admin/inventory/movements" />} className="rounded-xl">
          <History className="h-4 w-4 mr-2" /> Historial
        </Button>
        <Button onClick={openCreate} className="bg-brand text-white hover:bg-brand-dark rounded-xl shadow-glow">
          <Plus className="h-4 w-4 mr-2" /> Nuevo Producto
        </Button>
      </PageHeader>

      {/* Alerta de stock */}
      {(lowCount > 0 || outCount > 0) && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
          <p className="text-sm">
            <span className="font-semibold">Atención:</span>{" "}
            {outCount > 0 && <>{outCount} producto(s) <span className="font-semibold">agotado(s)</span>. </>}
            {lowCount > 0 && <>{lowCount} producto(s) con <span className="font-semibold">stock bajo</span>. </>}
            Revisa y repón para no quedarte sin insumos.
          </p>
        </div>
      )}

      {/* Alerta de vencimientos */}
      {((batchAlerts?.expiredCount ?? 0) > 0 || (batchAlerts?.expiringCount ?? 0) > 0) && (
        <div className="flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-orange-800">
          <CalendarClock className="h-5 w-5 shrink-0 mt-0.5 text-orange-500" />
          <p className="text-sm">
            <span className="font-semibold">Vencimientos:</span>{" "}
            {(batchAlerts?.expiredCount ?? 0) > 0 && <>{batchAlerts?.expiredCount} lote(s) <span className="font-semibold">vencido(s)</span>. </>}
            {(batchAlerts?.expiringCount ?? 0) > 0 && <>{batchAlerts?.expiringCount} lote(s) <span className="font-semibold">por vencer</span> (próximos 30 días). </>}
            Revisa los lotes de cada producto.
          </p>
        </div>
      )}

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {metricCards.map((c, i) => (
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

      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto, categoría o SKU..."
            className="w-full h-10 rounded-xl border border-input bg-card pl-9 pr-3 text-sm outline-none focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/15"
          />
        </div>
        <div className="flex gap-1 p-1 bg-muted/60 rounded-xl w-fit">
          {([["todos", "Todos"], ["bajo", "Stock bajo"], ["agotado", "Agotados"]] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === id ? "bg-card text-brand-dark shadow-soft" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla / lista */}
      <div className="rounded-2xl border border-border/70 bg-card shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-muted-foreground">Cargando inventario...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-16 w-16 rounded-2xl bg-brand-soft flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-brand" />
            </div>
            <h3 className="font-semibold text-foreground">Tu inventario está vacío</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-5">
              Crea tu primer producto o carga un set de ejemplo con stock para ver el módulo en acción.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={seedExamples} className="rounded-xl">
                <Boxes className="h-4 w-4 mr-2" /> Cargar ejemplos
              </Button>
              <Button onClick={openCreate} className="bg-brand text-white hover:bg-brand-dark rounded-xl shadow-glow">
                <Plus className="h-4 w-4 mr-2" /> Nuevo Producto
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="border-b border-border/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Producto</th>
                  <th className="px-4 py-3 font-semibold">Categoría</th>
                  <th className="px-4 py-3 font-semibold text-center">Stock</th>
                  <th className="px-4 py-3 font-semibold text-center">Mínimo</th>
                  <th className="px-4 py-3 font-semibold text-right">Costo</th>
                  <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const out = outOf(p); const low = lowOf(p)
                  return (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">{p.name}</p>
                        {p.sku && <p className="text-xs text-muted-foreground">SKU: {p.sku}</p>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.category || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => quickMove(p, "salida")} className="h-6 w-6 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-brand/40" title="Restar 1">
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className={`inline-flex items-center justify-center min-w-12 h-6 px-2 rounded-full text-xs font-bold ${
                            out ? "bg-red-100 text-red-700" : low ? "bg-amber-100 text-amber-700" : "bg-brand-soft text-brand-dark"
                          }`}>
                            {p.stock} {p.unit}
                          </span>
                          <button onClick={() => quickMove(p, "entrada")} className="h-6 w-6 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-brand/40" title="Sumar 1">
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{p.min_stock}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{p.cost ? clp(p.cost) : "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setAdjustFor(p); setAdjType("entrada"); setAdjQty("1"); setAdjReason("") }} className="text-brand hover:text-brand-dark">
                            Ajustar
                          </Button>
                          <button onClick={() => setBatchFor(p)} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted" title="Lotes y vencimientos">
                            <CalendarClock className="h-4 w-4" />
                          </button>
                          <button onClick={() => openEdit(p)} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted" title="Editar">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => removeProduct(p)} className="h-8 w-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50" title="Eliminar">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No hay productos que coincidan.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: crear / editar producto */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg bg-card rounded-2xl shadow-elevated border border-border/70 p-4 sm:p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-xl font-semibold text-foreground">{editing ? "Editar producto" : "Nuevo producto"}</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nombre *" className="sm:col-span-2">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Ej. Ácido Hialurónico 1ml" />
              </Field>
              <Field label="Categoría">
                <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls} placeholder="Rellenos, Insumos..." />
              </Field>
              <Field label="SKU / Código">
                <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className={inputCls} />
              </Field>
              {!editing && (
                <Field label="Stock inicial">
                  <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={inputCls} />
                </Field>
              )}
              <Field label="Stock mínimo (alerta)">
                <input type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Unidad">
                <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className={inputCls} placeholder="unidad, caja, vial..." />
              </Field>
              <Field label="Costo unitario">
                <input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Proveedor" className="sm:col-span-2">
                <input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} className={inputCls} />
              </Field>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">Cancelar</Button>
              <Button onClick={saveProduct} disabled={saving} className="bg-brand text-white hover:bg-brand-dark rounded-xl shadow-glow">
                <Save className="h-4 w-4 mr-2" /> {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: ajustar stock */}
      {adjustFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setAdjustFor(null)}>
          <div className="w-full max-w-md bg-card rounded-2xl shadow-elevated border border-border/70 p-4 sm:p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-display text-xl font-semibold text-foreground">Ajustar stock</h3>
              <button onClick={() => setAdjustFor(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-sm text-muted-foreground mb-5">{adjustFor.name} · stock actual: <span className="font-semibold text-foreground">{adjustFor.stock} {adjustFor.unit}</span></p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {([["entrada", "Entrada"], ["salida", "Salida"], ["ajuste", "Fijar"]] as const).map(([id, label]) => (
                <button key={id} onClick={() => setAdjType(id)}
                  className={`py-2 rounded-xl text-sm font-medium border transition-all ${adjType === id ? "bg-brand-soft border-brand/30 text-brand-dark" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}>
                  {label}
                </button>
              ))}
            </div>
            <Field label={adjType === "ajuste" ? "Nuevo stock total" : "Cantidad"}>
              <input type="number" value={adjQty} onChange={(e) => setAdjQty(e.target.value)} className={inputCls} />
            </Field>
            <div className="mt-3">
              <Field label="Motivo (opcional)">
                <input value={adjReason} onChange={(e) => setAdjReason(e.target.value)} className={inputCls} placeholder="Compra, uso en procedimiento, merma..." />
              </Field>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setAdjustFor(null)} className="rounded-xl">Cancelar</Button>
              <Button onClick={applyAdjust} className="bg-brand text-white hover:bg-brand-dark rounded-xl shadow-glow">Aplicar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: lotes y vencimientos */}
      {batchFor && (
        <BatchesDialog
          productId={batchFor.id}
          productName={batchFor.name}
          onClose={() => setBatchFor(null)}
          onChanged={refreshBatches}
        />
      )}
    </div>
  )
}

const inputCls =
  "w-full h-10 rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition-all focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/15"

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}
