"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { format } from "date-fns"
import {
  Users, Calendar, UserPlus, DollarSign, Clock, Package, CalendarClock,
  Wallet, ArrowRight, AlertTriangle, Scale,
} from "lucide-react"

const clp = (n: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n || 0)

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground text-center py-6">{text}</p>
}
function Loading() {
  return <p className="text-sm text-muted-foreground text-center py-6">Cargando...</p>
}

// ---- Resumen (KPIs) ----
export function ResumenWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["w-dashboard"],
    queryFn: async () => { const r = await fetch("/api/dashboard"); return r.ok ? r.json() : null },
  })
  if (isLoading) return <Loading />
  const s = data?.stats
  if (!s) return <Empty text="Sin datos" />
  const items = [
    { label: "Pacientes", value: s.activePatients ?? 0, icon: Users, c: "text-brand" },
    { label: "Citas hoy", value: s.todayAppointments ?? 0, icon: Calendar, c: "text-slate-500" },
    { label: "Nuevos (mes)", value: s.newPatientsThisMonth ?? 0, icon: UserPlus, c: "text-slate-500" },
    { label: "Ingresos hoy", value: clp(s.revenueToday || 0), icon: DollarSign, c: "text-emerald-600" },
  ]
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((it, i) => (
        <div key={i} className="rounded-xl border border-border/70 bg-background p-3">
          <it.icon className={`h-4 w-4 ${it.c} mb-1`} />
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">{it.label}</p>
          <p className="text-lg font-bold text-foreground truncate">{it.value}</p>
        </div>
      ))}
    </div>
  )
}

// ---- Agenda de hoy ----
export function AgendaWidget() {
  const { data = [], isLoading } = useQuery<any[]>({
    queryKey: ["w-waiting"],
    queryFn: async () => { const r = await fetch("/api/waiting-room"); return r.ok ? r.json() : [] },
  })
  if (isLoading) return <Loading />
  if (!data.length) return <Empty text="No hay citas para hoy." />
  return (
    <div className="space-y-2">
      {data.slice(0, 6).map((a) => (
        <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border/70 bg-background p-2.5">
          <div className="h-8 w-8 rounded-lg bg-brand-soft text-brand-dark flex items-center justify-center text-xs font-bold shrink-0">
            <Clock className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">{a.patient?.full_name || "Paciente"}</p>
            <p className="text-xs text-muted-foreground truncate">{a.service?.name || "Servicio"}</p>
          </div>
          <span className="text-xs font-semibold text-brand-dark shrink-0">{format(new Date(a.scheduled_at), "HH:mm")}</span>
        </div>
      ))}
    </div>
  )
}

// ---- Pacientes recientes ----
export function PacientesWidget() {
  const { data = [], isLoading } = useQuery<any[]>({
    queryKey: ["w-patients"],
    queryFn: async () => { const r = await fetch("/api/patients"); return r.ok ? r.json() : [] },
  })
  if (isLoading) return <Loading />
  const list = Array.isArray(data) ? data : []
  if (!list.length) return <Empty text="Sin pacientes." />
  return (
    <div className="space-y-2">
      {list.slice(0, 6).map((p) => (
        <Link key={p.id} href={`/admin/patients/${p.id}`} className="flex items-center gap-3 rounded-xl border border-border/70 bg-background p-2.5 hover:border-brand/40 transition-colors">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#54707F] to-[#6E8A98] text-white flex items-center justify-center text-xs font-bold shrink-0">
            {(p.full_name || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">{p.full_name}</p>
            <p className="text-xs text-muted-foreground truncate">{p.rut || p.phone || p.email || "—"}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </Link>
      ))}
    </div>
  )
}

// ---- Alertas de inventario ----
export function InventarioWidget() {
  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["w-inventory"],
    queryFn: async () => { const r = await fetch("/api/inventory"); return r.ok ? r.json() : [] },
  })
  const { data: batches } = useQuery<any>({
    queryKey: ["w-batches"],
    queryFn: async () => { const r = await fetch("/api/inventory/batches"); return r.ok ? r.json() : null },
  })
  const list = Array.isArray(products) ? products : []
  const low = list.filter((p) => p.stock > 0 && p.stock <= p.min_stock).length
  const out = list.filter((p) => p.stock <= 0).length
  const expiring = batches?.expiringCount ?? 0
  const expired = batches?.expiredCount ?? 0
  const rows = [
    { label: "Stock bajo", value: low, icon: AlertTriangle, c: "text-amber-600 bg-amber-50" },
    { label: "Agotados", value: out, icon: Package, c: "text-red-600 bg-red-50" },
    { label: "Por vencer", value: expiring, icon: CalendarClock, c: "text-orange-600 bg-orange-50" },
    { label: "Vencidos", value: expired, icon: CalendarClock, c: "text-red-600 bg-red-50" },
  ]
  return (
    <div className="grid grid-cols-2 gap-3">
      {rows.map((r, i) => (
        <div key={i} className={`rounded-xl p-3 ${r.c}`}>
          <r.icon className="h-4 w-4 mb-1" />
          <p className="text-[11px] uppercase tracking-wide font-semibold opacity-80">{r.label}</p>
          <p className="text-lg font-bold">{r.value}</p>
        </div>
      ))}
    </div>
  )
}

// ---- Caja del día ----
export function CajaWidget() {
  const { data, isLoading } = useQuery<any>({
    queryKey: ["w-cash"],
    queryFn: async () => { const r = await fetch("/api/cash"); return r.ok ? r.json() : null },
  })
  if (isLoading) return <Loading />
  const movements = data?.movements || []
  const appts = data?.appointments || []
  const apptIncome = appts.reduce((a: number, x: any) => a + (x.price || 0), 0)
  const manualIn = movements.filter((m: any) => m.type === "ingreso").reduce((a: number, m: any) => a + Number(m.amount), 0)
  const egresos = movements.filter((m: any) => m.type === "egreso").reduce((a: number, m: any) => a + Number(m.amount), 0)
  const ingresos = apptIncome + manualIn
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex items-center justify-between">
        <span className="text-sm text-emerald-700 flex items-center gap-2"><Wallet className="h-4 w-4" /> Ingresos hoy</span>
        <span className="text-lg font-bold text-emerald-700">{clp(ingresos)}</span>
      </div>
      <div className="rounded-xl border border-border/70 bg-background p-3 flex items-center justify-between">
        <span className="text-sm text-muted-foreground flex items-center gap-2"><Scale className="h-4 w-4" /> Balance</span>
        <span className="text-lg font-bold text-foreground">{clp(ingresos - egresos)}</span>
      </div>
    </div>
  )
}

// ---- Accesos rápidos ----
export function AccesosWidget() {
  const links = [
    { label: "Nuevo paciente", href: "/admin/patients/new", icon: UserPlus, tint: "bg-brand/10 text-brand" },
    { label: "Nueva cita", href: "/admin/appointments/new", icon: Calendar, tint: "bg-slate-50 text-slate-600 dark:bg-slate-950/40 dark:text-slate-400" },
    { label: "Inventario", href: "/admin/inventory", icon: Package, tint: "bg-slate-50 text-slate-600 dark:bg-slate-950/40 dark:text-slate-400" },
    { label: "Caja", href: "/admin/cash", icon: Wallet, tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" },
  ]
  return (
    <div className="grid grid-cols-2 gap-3">
      {links.map((l, i) => (
        <Link key={i} href={l.href} className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-background p-3 hover:border-brand/40 hover:shadow-soft transition-all">
          <div className={`h-9 w-9 rounded-lg ${l.tint} flex items-center justify-center shrink-0`}>
            <l.icon className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-foreground">{l.label}</span>
        </Link>
      ))}
    </div>
  )
}
