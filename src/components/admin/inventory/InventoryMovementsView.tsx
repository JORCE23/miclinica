"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { PageHeader } from "@/components/admin/PageHeader"
import { Button } from "@/components/ui/button"
import { History, ArrowDownCircle, ArrowUpCircle, SlidersHorizontal, ChevronLeft } from "lucide-react"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Movement = { id: string; type: string; quantity: number; reason: string | null; created_at: string; product: any }

const TYPE_META: Record<string, { label: string; icon: typeof ArrowDownCircle; cls: string }> = {
  entrada: { label: "Entrada", icon: ArrowDownCircle, cls: "bg-emerald-100 text-emerald-700" },
  salida: { label: "Salida", icon: ArrowUpCircle, cls: "bg-red-100 text-red-700" },
  ajuste: { label: "Ajuste", icon: SlidersHorizontal, cls: "bg-blue-100 text-blue-700" },
}

export function InventoryMovementsView() {
  const { data = [], isLoading } = useQuery<Movement[]>({
    queryKey: ["inventory-movements"],
    queryFn: async () => {
      const r = await fetch("/api/inventory/movements")
      if (!r.ok) throw new Error("Error al cargar")
      return r.json()
    },
  })

  return (
    <div className="space-y-5">
      <PageHeader title="Historial de movimientos" description="Cada entrada, salida y ajuste de tu inventario, en orden cronológico." icon={History}>
        <Button render={<Link href="/admin/inventory" />} className="bg-white/10 text-white border border-white/15 hover:bg-white/15 rounded-xl">
          <ChevronLeft className="h-4 w-4 mr-2" /> Volver al inventario
        </Button>
      </PageHeader>

      <div className="rounded-2xl border border-border/70 bg-card shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-muted-foreground">Cargando...</div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center">
            <History className="h-8 w-8 text-slate-300 mx-auto mb-3" />
            <p className="text-muted-foreground">Aún no hay movimientos registrados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead>
                <tr className="border-b border-border/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Producto</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold text-center">Cantidad</th>
                  <th className="px-4 py-3 font-semibold">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {data.map((m) => {
                  const meta = TYPE_META[m.type] || TYPE_META.ajuste
                  return (
                    <tr key={m.id} className="border-b border-border/50 hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{format(new Date(m.created_at), "dd MMM, HH:mm", { locale: es })}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{m.product?.name || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${meta.cls}`}>
                          <meta.icon className="h-3.5 w-3.5" /> {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-800">
                        {m.type === "salida" ? "−" : m.type === "entrada" ? "+" : ""}{m.quantity} {m.product?.unit || ""}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{m.reason || "—"}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
