"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { MessageCircle, CheckCircle2, Copy, Loader2, ChevronDown } from "lucide-react"

type Status = {
  connected: boolean
  display_phone: string
  phone_number_id: string
  verify_token: string
  has_token: boolean
}

export function WhatsappConnect() {
  const [status, setStatus] = useState<Status | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [form, setForm] = useState({ phone_number_id: "", access_token: "", waba_id: "" })
  const [webhookUrl, setWebhookUrl] = useState("")

  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/whatsapp/webhook`)
    fetch("/api/whatsapp/config").then((r) => r.json()).then((d) => {
      setStatus(d)
      setForm((f) => ({ ...f, phone_number_id: d.phone_number_id || "" }))
    }).finally(() => setLoading(false))
  }, [])

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copiado`)
  }

  const connect = async () => {
    if (!form.phone_number_id.trim() || !form.access_token.trim()) {
      toast.error("Ingresa el Phone Number ID y el Token.")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/whatsapp/config", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || "No se pudo conectar")
      toast.success(`WhatsApp conectado ${d.display_phone ? "(" + d.display_phone + ")" : ""}`)
      const r = await fetch("/api/whatsapp/config").then((x) => x.json())
      setStatus(r)
      setForm((f) => ({ ...f, access_token: "" }))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al conectar")
    } finally {
      setSaving(false)
    }
  }

  const disconnect = async () => {
    if (!confirm("¿Desconectar el WhatsApp de la clínica?")) return
    await fetch("/api/whatsapp/config", { method: "DELETE" })
    const r = await fetch("/api/whatsapp/config").then((x) => x.json())
    setStatus(r)
    toast.success("WhatsApp desconectado")
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center"><MessageCircle className="h-5 w-5" /></div>
          <div>
            <CardTitle>WhatsApp (Meta)</CardTitle>
            <CardDescription>Conecta el WhatsApp oficial de tu clínica para enviar recordatorios y responder con IA.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>
        ) : status?.connected ? (
          <>
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 p-4">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-foreground">WhatsApp conectado</p>
                <p className="text-sm text-muted-foreground">{status.display_phone || "Número verificado con Meta"}</p>
              </div>
              <Button variant="outline" onClick={disconnect} className="ml-auto rounded-xl">Desconectar</Button>
            </div>
            <WebhookBox webhookUrl={webhookUrl} verifyToken={status.verify_token} onCopy={copy} />
          </>
        ) : (
          <>
            {/* Paso 1: credenciales */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Phone Number ID</Label>
                <Input value={form.phone_number_id} onChange={(e) => setForm({ ...form, phone_number_id: e.target.value })} placeholder="Ej. 123456789012345" />
              </div>
              <div className="space-y-1.5">
                <Label>Token de acceso (permanente)</Label>
                <Input value={form.access_token} onChange={(e) => setForm({ ...form, access_token: e.target.value })} placeholder="EAAG..." type="password" />
              </div>
              <div className="space-y-1.5">
                <Label>WhatsApp Business Account ID <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                <Input value={form.waba_id} onChange={(e) => setForm({ ...form, waba_id: e.target.value })} placeholder="Opcional" />
              </div>
              <Button onClick={connect} disabled={saving} className="bg-brand text-white hover:bg-brand-dark rounded-xl shadow-glow">
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verificando con Meta…</> : "Conectar WhatsApp"}
              </Button>
            </div>

            {/* Paso 2: webhook (se necesita para recibir mensajes) */}
            {status?.verify_token ? <WebhookBox webhookUrl={webhookUrl} verifyToken={status.verify_token} onCopy={copy} /> : null}

            {/* Ayuda */}
            <button onClick={() => setShowHelp((v) => !v)} className="flex items-center gap-1.5 text-sm text-brand font-medium">
              <ChevronDown className={`h-4 w-4 transition-transform ${showHelp ? "rotate-180" : ""}`} /> ¿Dónde consigo estos datos?
            </button>
            {showHelp && (
              <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground space-y-1.5">
                <p>1. Entra a <b>developers.facebook.com</b> y crea una app de tipo <b>Negocio</b>.</p>
                <p>2. Agrega el producto <b>WhatsApp</b>. Ahí verás tu <b>Phone Number ID</b> y un token de prueba.</p>
                <p>3. Genera un <b>token permanente</b> (usuario del sistema) con permisos de WhatsApp.</p>
                <p>4. Pega ambos aquí y presiona <b>Conectar</b>.</p>
                <p>5. Luego copia la <b>URL del webhook</b> y el <b>Token de verificación</b> de abajo en la configuración de Webhooks de WhatsApp en Meta, y suscríbete a <b>messages</b>.</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function WebhookBox({ webhookUrl, verifyToken, onCopy }: { webhookUrl: string; verifyToken: string; onCopy: (t: string, l: string) => void }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
      <p className="text-sm font-medium text-foreground">Para recibir mensajes, configura el Webhook en Meta con estos datos:</p>
      <div className="space-y-2">
        <div>
          <Label className="text-xs">URL de devolución de llamada (Callback URL)</Label>
          <div className="flex gap-2 mt-1">
            <Input readOnly value={webhookUrl} className="font-mono text-xs" />
            <Button variant="outline" size="icon" onClick={() => onCopy(webhookUrl, "URL")} className="shrink-0"><Copy className="h-4 w-4" /></Button>
          </div>
        </div>
        <div>
          <Label className="text-xs">Token de verificación (Verify Token)</Label>
          <div className="flex gap-2 mt-1">
            <Input readOnly value={verifyToken} className="font-mono text-xs" />
            <Button variant="outline" size="icon" onClick={() => onCopy(verifyToken, "Token")} className="shrink-0"><Copy className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </div>
  )
}
