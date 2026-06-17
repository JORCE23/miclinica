"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { X, Plus, Trash2, Package } from "lucide-react"

type InvProduct = { id: string; name: string; unit: string; stock: number }
type Recipe = { id: string; quantity: number; product: InvProduct | null }

export function ServiceInsumosDialog({
  serviceId,
  serviceName,
  onClose,
}: {
  serviceId: string
  serviceName: string
  onClose: () => void
}) {
  const [recipe, setRecipe] = useState<Recipe[]>([])
  const [products, setProducts] = useState<InvProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [productId, setProductId] = useState("")
  const [qty, setQty] = useState("1")

  const load = async () => {
    const [rRes, pRes] = await Promise.all([
      fetch(`/api/services/${serviceId}/products`),
      fetch("/api/inventory"),
    ])
    if (rRes.ok) setRecipe(await rRes.json())
    if (pRes.ok) setProducts(await pRes.json())
    setLoading(false)
  }

  useEffect(() => { load() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [serviceId])

  const add = async () => {
    if (!productId) { toast.error("Elige un producto"); return }
    const r = await fetch(`/api/services/${serviceId}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, quantity: Number(qty) || 1 }),
    })
    if (!r.ok) { toast.error("No se pudo agregar"); return }
    setProductId(""); setQty("1")
    load()
  }

  const remove = async (pid: string) => {
    const r = await fetch(`/api/services/${serviceId}/products?product_id=${pid}`, { method: "DELETE" })
    if (!r.ok) { toast.error("No se pudo quitar"); return }
    load()
  }

  const available = products.filter((p) => !recipe.some((r) => r.product?.id === p.id))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-card rounded-2xl shadow-elevated border border-border/70 p-4 sm:p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
            <Package className="h-5 w-5 text-brand" /> Insumos del servicio
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <p className="text-sm text-muted-foreground mb-5">{serviceName} — al completar una cita, se descuenta este consumo del inventario.</p>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground text-sm">Cargando...</div>
        ) : (
          <>
            <div className="space-y-2 mb-5">
              {recipe.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4 border border-dashed border-border rounded-xl">
                  Este servicio aún no consume insumos.
                </p>
              )}
              {recipe.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/70 bg-background">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.product?.name || "Producto eliminado"}</p>
                    <p className="text-xs text-muted-foreground">Stock actual: {r.product?.stock ?? "—"} {r.product?.unit}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold text-brand-dark">x{r.quantity}</span>
                    {r.product && (
                      <button onClick={() => remove(r.product!.id)} className="h-8 w-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {available.length > 0 ? (
              <div className="flex items-end gap-2 pt-4 border-t border-border">
                <div className="flex-1 min-w-0">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Producto</label>
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/15"
                  >
                    <option value="">Selecciona...</option>
                    {available.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.stock} {p.unit})</option>
                    ))}
                  </select>
                </div>
                <div className="w-20">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Cant.</label>
                  <input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/15" />
                </div>
                <Button onClick={add} className="bg-brand text-white hover:bg-brand-dark rounded-xl h-10">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              products.length === 0 && (
                <p className="text-xs text-muted-foreground text-center pt-4 border-t border-border">
                  No tienes productos en el inventario todavía. Crea productos en la sección Inventario.
                </p>
              )
            )}
          </>
        )}

        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cerrar</Button>
        </div>
      </div>
    </div>
  )
}
