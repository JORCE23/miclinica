"use client"

import { useState, useRef, MouseEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2 } from "lucide-react"

export interface DiagramPoint {
  id: string
  x: number
  y: number
  treatment: string
  notes: string
  view?: "front" | "profile"
}

interface FacialDiagramProps {
  points: DiagramPoint[]
  onChange: (points: DiagramPoint[]) => void
  disabled?: boolean
}

export function FacialDiagram({ points, onChange, disabled }: FacialDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null)
  const [view, setView] = useState<"front" | "profile">("front")

  const handleImageClick = (e: MouseEvent<HTMLDivElement>) => {
    if (disabled) return
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const newPoint: DiagramPoint = {
      id: Math.random().toString(36).substring(7),
      x,
      y,
      treatment: "Botox", // Default
      notes: "",
      view
    }

    const newPoints = [...points, newPoint]
    onChange(newPoints)
    setSelectedPointId(newPoint.id)
  }

  const handlePointClick = (e: MouseEvent, id: string) => {
    e.stopPropagation()
    setSelectedPointId(id)
  }

  const updatePoint = (id: string, updates: Partial<DiagramPoint>) => {
    onChange(points.map(p => p.id === id ? { ...p, ...updates } : p))
  }

  const removePoint = (id: string) => {
    onChange(points.filter(p => p.id !== id))
    if (selectedPointId === id) setSelectedPointId(null)
  }

  // Filtrar los puntos para la vista actual (si un punto viejo no tiene view, asumimos 'front')
  const visiblePoints = points.filter(p => (p.view || "front") === view)

  return (
    <div className="flex flex-col md:flex-row gap-6 bg-muted/30 p-4 rounded-xl border">
      {/* Diagram Area */}
      <div className="flex-1 max-w-[400px] mx-auto w-full relative">
        <div className="flex justify-center gap-2 mb-4">
          <Button 
            variant={view === "front" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setView("front")}
            className={view === "front" ? "bg-[#1A1A14] hover:bg-[#2A2A22] text-white" : ""}
          >
            Vista Frontal
          </Button>
          <Button 
            variant={view === "profile" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setView("profile")}
            className={view === "profile" ? "bg-[#1A1A14] hover:bg-[#2A2A22] text-white" : ""}
          >
            Vista de Perfil
          </Button>
        </div>

        <div 
          ref={containerRef}
          className={`relative w-full aspect-[3/4] bg-white rounded-xl shadow-sm border overflow-hidden ${disabled ? 'cursor-default' : 'cursor-crosshair'}`}
          onClick={handleImageClick}
        >
          <img 
            src={view === "front" ? "/facial-anatomy-3d.png" : "/facial-anatomy-profile.png"} 
            alt="Esquema Facial Muscular" 
            className="w-full h-full object-cover pointer-events-none"
          />
          
          <div style={{ transform: 'translateZ(50px)', position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {visiblePoints.map((point) => {
              // Encontrar el índice global del punto para que el número (Punto 1, Punto 2) coincida
              const globalIndex = points.findIndex(p => p.id === point.id)
              
              return (
                <div
                  key={point.id}
                  className={`absolute w-4 h-4 -ml-2 -mt-2 rounded-full flex items-center justify-center text-[9px] font-bold shadow-md cursor-pointer transition-transform pointer-events-auto ${
                    selectedPointId === point.id ? 'bg-slate-600 text-white scale-125 z-10' : 'bg-[#1A1A14] text-white hover:scale-110'
                  }`}
                  style={{ left: `${point.x}%`, top: `${point.y}%` }}
                  onClick={(e) => handlePointClick(e, point.id)}
                >
                  {globalIndex + 1}
                </div>
              )
            })}
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-4">
          {disabled ? 'Vista de solo lectura' : 'Haz clic en el rostro para marcar un punto.'}
        </p>
      </div>

      {/* Detail Area */}
      <div className="flex-1 flex flex-col min-h-[300px]">
        <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Puntos de Tratamiento ({view === 'front' ? 'Frontal' : 'Perfil'})</h4>
        
        {visiblePoints.length === 0 ? (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed rounded-xl p-8 text-center text-muted-foreground">
            Aún no hay puntos marcados en la vista actual.
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto pr-2 flex-1 max-h-[500px]">
            {visiblePoints.map((point) => {
              const globalIndex = points.findIndex(p => p.id === point.id)

              return (
                <div 
                  key={point.id} 
                  className={`p-3 rounded-lg border transition-colors ${selectedPointId === point.id ? 'border-slate-500 bg-slate-50/50 dark:bg-slate-900/10' : 'bg-card hover:border-slate-300'}`}
                  onClick={() => setSelectedPointId(point.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300">
                        {globalIndex + 1}
                      </span>
                      <span className="font-medium text-sm">Punto {globalIndex + 1}</span>
                    </div>
                    {!disabled && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); removePoint(point.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Input 
                      size={1}
                      placeholder="Tratamiento (Ej. Botox, Ácido)" 
                      value={point.treatment}
                      onChange={(e) => updatePoint(point.id, { treatment: e.target.value })}
                      className="h-8 text-sm"
                      disabled={disabled}
                    />
                    <Input 
                      size={1}
                      placeholder="Dosis / Notas (Ej. 2 unidades)" 
                      value={point.notes}
                      onChange={(e) => updatePoint(point.id, { notes: e.target.value })}
                      className="h-8 text-sm"
                      disabled={disabled}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

