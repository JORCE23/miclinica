"use client"

import { useState, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { PageHeader } from "@/components/admin/PageHeader"
import { WhatsappButton } from "@/components/admin/WhatsappButton"
import { MailButton } from "@/components/admin/MailButton"
import { Handshake, Trash2, Copy, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

type Collab = { id: string; name: string; email: string | null; phone: string | null; role: string | null; message: string | null; status: string; created_at: string }

const STATUS = ["nuevo", "revisado", "contactado", "descartado"]
const STATUS_CLS: Record<string, string> = {
  nuevo: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
  revisado: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  contactado: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
  descartado: "bg-muted text-muted-foreground",
}

export function CollaborationsView() {
  const qc = useQueryClient()
  const [origin, setOrigin] = useState("")
  useEffect(() => { if (typeof window !== "undefined") setOrigin(window.location.origin) }, [])

  const { data: items = [], isLoading } = useQuery<Collab[]>({
    queryKey: ["collaborations"],
    queryFn: async () => { const r = await fetch("/api/collaborations"); return r.ok ? r.json() : [] },
  })
  const { data: clinic } = useQuery<{ slug?: string }>({
    queryKey: ["clinic_settings"],
    queryFn: async () => { const r = await fetch("/api/settings"); return r.ok ? r.json() : {} },
  })

  const refresh = () => qc.invalidateQueries({ queryKey: ["collaborations"] })
  const setStatus = async (id: string, status: string) => {
    await fetch(`/api/collaborations/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) })
    refresh()
  }
  const remove = async (id: string) => {
    if (!confirm("¿Eliminar esta postulación?")) return
    await fetch(`/api/collaborations/${id}`, { method: "DELETE" })
    refresh()
  }

  const formUrl = clinic?.slug ? `${origin}/colaborar/${clinic.slug}` : ""

  return (
    <div className="space-y-5">
      <PageHeader title="Colaboraciones" description="Postulaciones de gente que quiere colaborar con la clínica, recibidas desde el formulario público." icon={Handshake} />

      {/* Compartir formulario */}
      {formUrl && (
        <div className="rounded-2xl border border-border/70 bg-card shadow-soft p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Link del formulario público</p>
            <p className="text-sm font-mono text-foreground truncate">{formUrl}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { navigator.clipboard.writeText(formUrl); toast.success("Link copiado") }} className="h-9 px-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted inline-flex items-center gap-1.5"><Copy className="h-4 w-4" /> Copiar</button>
            <button onClick={() => window.open(formUrl, "_blank")} className="h-9 px-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted inline-flex items-center gap-1.5"><ExternalLink className="h-4 w-4" /> Abrir</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="p-10 text-center text-muted-foreground">Cargando…</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
          <Handshake className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Aún no hay postulaciones. Comparte el link del formulario.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border/70 bg-card shadow-soft p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{c.name}</p>
                  {c.role && <p className="text-xs text-muted-foreground">{c.role}</p>}
                  <p className="text-[11px] text-muted-foreground mt-0.5">{format(new Date(c.created_at), "d 'de' MMM, HH:mm", { locale: es })}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_CLS[c.status] || STATUS_CLS.nuevo}`}>{c.status}</span>
              </div>
              {c.message && <p className="text-sm text-muted-foreground mt-2 leading-relaxed whitespace-pre-wrap">{c.message}</p>}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <WhatsappButton phone={c.phone} message={`Hola ${c.name.split(" ")[0]}, gracias por tu interés en colaborar con la clínica 👋`} size="sm" />
                <MailButton email={c.email} subject="Colaboración" body={`Hola ${c.name.split(" ")[0]},\n\n`} size="sm" />
                <select value={c.status} onChange={(e) => setStatus(c.id, e.target.value)} className="h-8 rounded-lg border border-input bg-background px-2 text-xs ml-auto">
                  {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => remove(c.id)} className="h-8 w-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
