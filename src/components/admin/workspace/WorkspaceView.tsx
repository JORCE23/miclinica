"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/admin/PageHeader"
import { Button } from "@/components/ui/button"
import {
  LayoutGrid, GripVertical, Maximize2, Minimize2, X, Plus, RotateCcw,
  LayoutDashboard, Calendar, Users, Package, Wallet, Zap,
} from "lucide-react"
import {
  ResumenWidget, AgendaWidget, PacientesWidget, InventarioWidget, CajaWidget, AccesosWidget,
} from "./Widgets"

type Size = "sm" | "lg"
type WidgetId = "resumen" | "agenda" | "pacientes" | "inventario" | "caja" | "accesos"
type Item = { id: WidgetId; size: Size }

const REGISTRY: Record<WidgetId, { title: string; icon: typeof LayoutGrid; Comp: () => JSX.Element; size: Size }> = {
  resumen: { title: "Resumen", icon: LayoutDashboard, Comp: ResumenWidget, size: "lg" },
  agenda: { title: "Agenda de hoy", icon: Calendar, Comp: AgendaWidget, size: "sm" },
  pacientes: { title: "Pacientes recientes", icon: Users, Comp: PacientesWidget, size: "sm" },
  inventario: { title: "Inventario", icon: Package, Comp: InventarioWidget, size: "sm" },
  caja: { title: "Caja del día", icon: Wallet, Comp: CajaWidget, size: "sm" },
  accesos: { title: "Accesos rápidos", icon: Zap, Comp: AccesosWidget, size: "lg" },
}

const ALL_IDS = Object.keys(REGISTRY) as WidgetId[]
const DEFAULT_LAYOUT: Item[] = [
  { id: "resumen", size: "lg" },
  { id: "agenda", size: "sm" },
  { id: "accesos", size: "lg" },
]
const STORAGE_KEY = "medique:workspace"

export function WorkspaceView() {
  const [layout, setLayout] = useState<Item[]>(DEFAULT_LAYOUT)
  const [loaded, setLoaded] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Item[]
        if (Array.isArray(parsed)) setLayout(parsed.filter((i) => ALL_IDS.includes(i.id)))
      }
    } catch { /* noop */ }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
  }, [layout, loaded])

  const inLayout = (id: WidgetId) => layout.some((i) => i.id === id)
  const palette = ALL_IDS.filter((id) => !inLayout(id))

  const addWidget = (id: WidgetId) => {
    if (inLayout(id)) return
    setLayout((prev) => [...prev, { id, size: REGISTRY[id].size }])
  }
  const removeWidget = (id: WidgetId) => setLayout((prev) => prev.filter((i) => i.id !== id))
  const toggleSize = (id: WidgetId) =>
    setLayout((prev) => prev.map((i) => (i.id === id ? { ...i, size: i.size === "lg" ? "sm" : "lg" } : i)))
  const moveWidget = (from: number, to: number) => {
    if (from === to) return
    setLayout((prev) => {
      const next = [...prev]
      const [m] = next.splice(from, 1)
      next.splice(to, 0, m)
      return next
    })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Mi Panel"
        description="Arma tu pantalla: arrastra (o toca) los widgets que necesites y verás todo en un solo lugar."
        icon={LayoutGrid}
      >
        <Button variant="outline" onClick={() => setLayout(DEFAULT_LAYOUT)} className="rounded-xl">
          <RotateCcw className="h-4 w-4 mr-2" /> Restablecer
        </Button>
      </PageHeader>

      {/* Paleta de widgets disponibles */}
      <div className="rounded-2xl border border-border/70 bg-card shadow-soft p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Widgets disponibles — arrastra al tablero o toca para agregar</p>
        {palette.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ya agregaste todos los widgets. 🎉</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {palette.map((id) => {
              const w = REGISTRY[id]
              return (
                <button
                  key={id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("new", id)}
                  onClick={() => addWidget(id)}
                  className="group flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-slate-700 hover:border-brand/40 hover:bg-brand-soft hover:text-brand-dark cursor-grab active:cursor-grabbing transition-all"
                >
                  <w.icon className="h-4 w-4 text-brand" />
                  {w.title}
                  <Plus className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100" />
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Tablero (zona de drop) */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          const id = e.dataTransfer.getData("new") as WidgetId
          if (id) addWidget(id)
        }}
        className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 ${layout.length === 0 ? "min-h-[300px]" : ""}`}
      >
        {layout.length === 0 && (
          <div className="md:col-span-2 xl:col-span-3 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 p-12 text-center">
            <LayoutGrid className="h-10 w-10 text-slate-300 mb-3" />
            <h3 className="font-semibold text-slate-700">Tu panel está vacío</h3>
            <p className="text-sm text-muted-foreground mt-1">Arrastra widgets desde arriba o tócalos para agregarlos aquí.</p>
          </div>
        )}

        {layout.map((item, index) => {
          const w = REGISTRY[item.id]
          return (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => { setDragIndex(index); e.dataTransfer.setData("move", String(index)) }}
              onDragEnd={() => setDragIndex(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.stopPropagation()
                const move = e.dataTransfer.getData("move")
                if (move !== "") { moveWidget(Number(move), index); return }
                const nid = e.dataTransfer.getData("new") as WidgetId
                if (nid) addWidget(nid)
              }}
              className={`rounded-2xl border border-border/70 bg-card shadow-soft flex flex-col transition-all ${
                item.size === "lg" ? "md:col-span-2" : ""
              } ${dragIndex === index ? "opacity-50 ring-2 ring-brand/40" : ""}`}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/70 cursor-grab active:cursor-grabbing">
                <div className="flex items-center gap-2 min-w-0">
                  <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                  <w.icon className="h-4 w-4 text-brand shrink-0" />
                  <h3 className="font-semibold text-sm text-foreground truncate">{w.title}</h3>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleSize(item.id)} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted" title={item.size === "lg" ? "Achicar" : "Agrandar"}>
                    {item.size === "lg" ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => removeWidget(item.id)} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50" title="Quitar">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="p-4 flex-1">
                <w.Comp />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
