"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ClipboardCheck, Plus, Trash2, Calendar } from "lucide-react"
import { format, isPast, isToday } from "date-fns"
import { es } from "date-fns/locale"

type Task = { id: string; title: string; notes: string | null; done: boolean; priority: string; due_date: string | null; created_at: string }

const PRIORITY = {
  alta: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-900/40",
  normal: "bg-muted text-muted-foreground border-border",
  baja: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-900/40",
} as Record<string, string>

const selectCls = "h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/15"

export function PendingView() {
  const qc = useQueryClient()
  const [title, setTitle] = useState("")
  const [priority, setPriority] = useState("normal")
  const [dueDate, setDueDate] = useState("")

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const r = await fetch("/api/tasks")
      return r.ok ? r.json() : []
    },
  })

  const refresh = () => qc.invalidateQueries({ queryKey: ["tasks"] })

  const addTask = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/tasks", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, priority, due_date: dueDate || null }),
      })
      if (!r.ok) throw new Error()
    },
    onSuccess: () => { setTitle(""); setPriority("normal"); setDueDate(""); refresh(); toast.success("Pendiente agregado") },
    onError: () => toast.error("No se pudo agregar"),
  })

  const toggle = async (t: Task) => {
    await fetch(`/api/tasks/${t.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ done: !t.done }) })
    refresh()
  }
  const remove = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" })
    refresh()
  }

  const pendientes = tasks.filter((t) => !t.done)
  const completadas = tasks.filter((t) => t.done)

  const dueLabel = (d: string | null) => {
    if (!d) return null
    const date = new Date(d + "T00:00:00")
    const overdue = isPast(date) && !isToday(date)
    return <span className={`inline-flex items-center gap-1 text-[11px] ${overdue ? "text-red-600 font-semibold" : "text-muted-foreground"}`}><Calendar className="h-3 w-3" />{isToday(date) ? "Hoy" : format(date, "d MMM", { locale: es })}</span>
  }

  const Row = ({ t }: { t: Task }) => (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-border/60 last:border-b-0">
      <button
        onClick={() => toggle(t)}
        className={`mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${t.done ? "bg-brand border-brand text-white" : "border-border hover:border-brand"}`}
        title={t.done ? "Marcar como pendiente" : "Marcar como hecho"}
      >
        {t.done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${t.done ? "line-through text-muted-foreground" : "text-foreground font-medium"}`}>{t.title}</p>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${PRIORITY[t.priority] || PRIORITY.normal}`}>{t.priority}</span>
          {dueLabel(t.due_date)}
        </div>
      </div>
      <button onClick={() => remove(t.id)} className="h-7 w-7 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 shrink-0" title="Eliminar">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )

  return (
    <div className="space-y-5">
      <PageHeader title="Pendientes" description="Tareas generales del equipo: responder comentarios, revisar presupuestos de campaña, recados, etc." icon={ClipboardCheck} />

      {/* Agregar */}
      <div className="rounded-2xl border border-border/70 bg-card shadow-soft p-4">
        <form
          onSubmit={(e) => { e.preventDefault(); if (title.trim()) addTask.mutate() }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nuevo pendiente…" className="flex-1" />
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className={selectCls}>
            <option value="alta">Alta</option>
            <option value="normal">Normal</option>
            <option value="baja">Baja</option>
          </select>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={selectCls} />
          <Button type="submit" disabled={addTask.isPending || !title.trim()} className="bg-brand text-white hover:bg-brand-dark rounded-xl shadow-glow">
            <Plus className="h-4 w-4 mr-1.5" /> Agregar
          </Button>
        </form>
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-muted-foreground">Cargando…</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-border/70 bg-card shadow-soft overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30"><h2 className="text-sm font-semibold text-foreground">Pendientes ({pendientes.length})</h2></div>
            {pendientes.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">Nada pendiente. 🎉</div> : pendientes.map((t) => <Row key={t.id} t={t} />)}
          </div>
          <div className="rounded-2xl border border-border/70 bg-card shadow-soft overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30"><h2 className="text-sm font-semibold text-foreground">Completadas ({completadas.length})</h2></div>
            {completadas.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">Aún nada completado.</div> : completadas.map((t) => <Row key={t.id} t={t} />)}
          </div>
        </div>
      )}
    </div>
  )
}
