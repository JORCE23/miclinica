"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScanLine, X, Trash2, Sparkles, Loader2, Plus } from "lucide-react"

type Item = { name: string; quantity: number; unit_cost: number; category: string; include: boolean }

// Escala un canvas a un dataURL JPEG dentro de los límites de la IA
function scaleCanvasToDataUrl(canvas: HTMLCanvasElement, maxDim = 1600, quality = 0.85): string {
  const { width, height } = canvas
  if (width > maxDim || height > maxDim) {
    const s = maxDim / Math.max(width, height)
    const out = document.createElement("canvas")
    out.width = Math.round(width * s); out.height = Math.round(height * s)
    out.getContext("2d")!.drawImage(canvas, 0, 0, out.width, out.height)
    return out.toDataURL("image/jpeg", quality)
  }
  return canvas.toDataURL("image/jpeg", quality)
}

// Imagen → dataURL reducido
function resizeImage(file: File, maxDim = 1400, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = img.width; canvas.height = img.height
        canvas.getContext("2d")!.drawImage(img, 0, 0)
        resolve(scaleCanvasToDataUrl(canvas, maxDim, quality))
      }
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// PDF → imagen (renderiza hasta 3 páginas y las une verticalmente)
async function renderPdfToImage(file: File): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjs: any = await import("pdfjs-dist")
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
  const data = new Uint8Array(await file.arrayBuffer())
  const pdf = await pdfjs.getDocument({ data }).promise
  const n = Math.min(pdf.numPages, 3)
  const canvases: HTMLCanvasElement[] = []
  for (let i = 1; i <= n; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 1.6 })
    const c = document.createElement("canvas")
    c.width = viewport.width; c.height = viewport.height
    const ctx = c.getContext("2d")!
    await page.render({ canvasContext: ctx, viewport, canvas: c }).promise
    canvases.push(c)
  }
  const width = Math.max(...canvases.map((c) => c.width))
  const height = canvases.reduce((s, c) => s + c.height, 0)
  const out = document.createElement("canvas")
  out.width = width; out.height = height
  const octx = out.getContext("2d")!
  octx.fillStyle = "#fff"; octx.fillRect(0, 0, width, height)
  let y = 0
  for (const c of canvases) { octx.drawImage(c, 0, y); y += c.height }
  return scaleCanvasToDataUrl(out, 1700, 0.85)
}

export function InvoiceImport({ onImported }: { onImported: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [reading, setReading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [converting, setConverting] = useState(false)
  const [items, setItems] = useState<Item[] | null>(null)
  const [proveedor, setProveedor] = useState<string | null>(null)

  const reset = () => { setPreview(null); setDataUrl(null); setItems(null); setProveedor(null); setReading(false); setSaving(false) }
  const close = () => { setOpen(false); reset() }

  const onPick = async (file?: File | null) => {
    if (!file) return
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
    setConverting(true)
    try {
      const url = isPdf ? await renderPdfToImage(file) : await resizeImage(file)
      setDataUrl(url); setPreview(url); setItems(null)
    } catch {
      toast.error(isPdf ? "No se pudo procesar el PDF" : "No se pudo leer la imagen")
    } finally {
      setConverting(false)
    }
  }

  const readInvoice = async () => {
    if (!dataUrl) return
    setReading(true)
    try {
      const r = await fetch("/api/inventory/import-invoice", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      })
      const d = await r.json()
      if (!r.ok) { toast.error(d?.error || "No se pudo leer la factura"); return }
      if (!d.items?.length) { toast.error("No reconocí productos en la imagen. Prueba con una foto más nítida."); return }
      setProveedor(d.proveedor || null)
      setItems(d.items.map((it: Omit<Item, "include">) => ({ ...it, include: true })))
    } catch { toast.error("Error al leer la factura") }
    finally { setReading(false) }
  }

  const setItem = (i: number, patch: Partial<Item>) =>
    setItems((arr) => arr!.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  const removeItem = (i: number) => setItems((arr) => arr!.filter((_, idx) => idx !== i))

  const apply = async () => {
    const selected = (items || []).filter((it) => it.include && it.name.trim() && it.quantity > 0)
    if (!selected.length) { toast.error("No hay productos seleccionados"); return }
    setSaving(true)
    try {
      const r = await fetch("/api/inventory/apply-invoice", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proveedor, items: selected }),
      })
      const d = await r.json()
      if (!r.ok) { toast.error(d?.error || "No se pudo agregar al inventario"); return }
      toast.success(`Inventario actualizado: ${d.created} nuevos, ${d.updated} repuestos`)
      onImported()
      close()
    } catch { toast.error("Error al agregar al inventario") }
    finally { setSaving(false) }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="rounded-xl">
        <ScanLine className="h-4 w-4 mr-2" /> Cargar factura
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={close}>
          <div className="w-full max-w-2xl bg-card rounded-2xl shadow-elevated border border-border/70 p-4 sm:p-6 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-semibold text-foreground flex items-center gap-2"><ScanLine className="h-5 w-5 text-brand" /> Cargar factura de compra</h3>
              <button onClick={close} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>

            {!items ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Sube una <b>foto</b> o un <b>PDF</b> de la factura/boleta. La IA leerá los productos, cantidades y precios para agregarlos al inventario.</p>
                <input ref={fileRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => onPick(e.target.files?.[0])} />
                {converting ? (
                  <div className="w-full border-2 border-dashed border-border rounded-xl p-10 text-center text-muted-foreground flex flex-col items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" /> Procesando archivo…
                  </div>
                ) : preview ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="Factura" className="max-h-72 w-full object-contain rounded-xl border bg-muted/30" />
                    <button onClick={() => { setPreview(null); setDataUrl(null) }} className="absolute top-2 right-2 h-8 w-8 rounded-lg bg-black/50 text-white flex items-center justify-center"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-border rounded-xl p-10 text-center text-muted-foreground hover:border-brand/40 hover:text-foreground transition-colors">
                    <ScanLine className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Toca para subir una <b>foto</b> o un <b>PDF</b> de la factura
                  </button>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={close}>Cancelar</Button>
                  <Button onClick={readInvoice} disabled={!dataUrl || reading || converting} className="bg-brand text-white hover:bg-brand-dark rounded-xl shadow-glow">
                    {reading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Leyendo…</> : <><Sparkles className="h-4 w-4 mr-2" /> Leer factura</>}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Revisa lo que entendió la IA{proveedor ? ` (proveedor: ${proveedor})` : ""}. Corrige lo que haga falta y confirma.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[560px]">
                    <thead>
                      <tr className="text-left text-xs uppercase text-muted-foreground border-b border-border">
                        <th className="py-2 pr-2 w-8"></th>
                        <th className="py-2 pr-2">Producto</th>
                        <th className="py-2 pr-2 w-20">Cant.</th>
                        <th className="py-2 pr-2 w-28">Costo unit.</th>
                        <th className="py-2 pr-2">Categoría</th>
                        <th className="py-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, i) => (
                        <tr key={i} className={`border-b border-border/50 ${!it.include ? "opacity-40" : ""}`}>
                          <td className="py-1.5 pr-2"><input type="checkbox" checked={it.include} onChange={(e) => setItem(i, { include: e.target.checked })} className="h-4 w-4 accent-[#162439]" /></td>
                          <td className="py-1.5 pr-2"><Input value={it.name} onChange={(e) => setItem(i, { name: e.target.value })} className="h-8 text-sm" /></td>
                          <td className="py-1.5 pr-2"><Input type="number" value={it.quantity} onChange={(e) => setItem(i, { quantity: Number(e.target.value) })} className="h-8 text-sm" /></td>
                          <td className="py-1.5 pr-2"><Input type="number" value={it.unit_cost} onChange={(e) => setItem(i, { unit_cost: Number(e.target.value) })} className="h-8 text-sm" /></td>
                          <td className="py-1.5 pr-2"><Input value={it.category} onChange={(e) => setItem(i, { category: e.target.value })} placeholder="—" className="h-8 text-sm" /></td>
                          <td className="py-1.5"><button onClick={() => removeItem(i)} className="h-7 w-7 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap justify-between gap-2 pt-2">
                  <Button variant="outline" onClick={() => setItems([...items, { name: "", quantity: 1, unit_cost: 0, category: "", include: true }])} className="rounded-xl">
                    <Plus className="h-4 w-4 mr-1.5" /> Agregar fila
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => setItems(null)}>Volver</Button>
                    <Button onClick={apply} disabled={saving} className="bg-brand text-white hover:bg-brand-dark rounded-xl shadow-glow">
                      {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Agregando…</> : "Confirmar y agregar al inventario"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
