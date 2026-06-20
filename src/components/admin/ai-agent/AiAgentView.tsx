"use client"

import { useState, useRef, useEffect } from "react"
import { PageHeader } from "@/components/admin/PageHeader"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Bot, Send, Search, Phone, CheckCheck, Plug, Sparkles, Cpu,
  SlidersHorizontal, MessageCircle, ChevronLeft, Circle, Zap, RefreshCw,
  Users, CalendarCheck, Percent, Headset, Pause, Play,
} from "lucide-react"

// Respuestas rápidas (plantillas) para responder con un toque
const QUICK_REPLIES = [
  { label: "Precios", text: "Te comparto nuestros precios 💅: Limpieza facial $25.000, Bioestimulación $80.000, Ácido hialurónico (labios) $180.000." },
  { label: "Horario", text: "Nuestro horario es Lun a Vie de 09:00 a 19:00 y Sáb de 10:00 a 14:00. 🕘" },
  { label: "Ubicación", text: "Estamos en Av. Providencia 1234, Santiago 📍. ¡Te esperamos!" },
  { label: "Agendar", text: "¿Para qué servicio y qué día te gustaría agendar? Reviso disponibilidad y te confirmo. 📅" },
  { label: "Gracias", text: "¡Gracias por escribirnos! 😊 Cualquier cosa quedamos atentos. ✨" },
]

// =============================================================================
//  PROTOTIPO — Agente IA + Bandeja de WhatsApp (UltraMsg)
//  Todo funciona con datos de ejemplo (mock). No llama a ninguna API todavía.
//  Para conectar de verdad más adelante:
//   1) WhatsApp: reemplazar las conversaciones mock por la API de UltraMsg
//      (GET /chats, /messages  y  POST /messages/chat para responder).
//   2) IA: reemplazar `simulateBotReply()` por una llamada a tu endpoint
//      (Groq / Gemini / Claude / OpenAI / Ollama) pasando el contexto del negocio.
// =============================================================================

type AgentModel = {
  id: string
  name: string
  provider: string
  tag: "Gratis" | "Económico" | "Premium"
  note: string
}

// Opciones priorizando bajo/cero costo (para no gastar créditos como con Gemini de pago)
const AGENT_MODELS: AgentModel[] = [
  { id: "groq-llama-3.3-70b", name: "Llama 3.3 70B", provider: "Groq", tag: "Gratis", note: "Muy rápido y gratuito. Recomendado para empezar." },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "Google", tag: "Gratis", note: "Gratis con límites diarios generosos." },
  { id: "ollama-llama3", name: "Llama 3 (local)", provider: "Ollama", tag: "Gratis", note: "Corre en tu propio servidor. Costo $0." },
  { id: "claude-haiku", name: "Claude Haiku", provider: "Anthropic", tag: "Económico", note: "Muy capaz y de bajo costo por mensaje." },
  { id: "gpt-4o-mini", name: "GPT-4o mini", provider: "OpenAI", tag: "Económico", note: "Económico y confiable." },
]

type ChatMessage = { id: string; from: "contact" | "bot"; text: string; time: string }

type Conversation = {
  id: string
  name: string
  phone: string
  lastMessage: string
  time: string
  unread: number
  online: boolean
}

const MOCK_CONVERSATIONS: Conversation[] = [
  { id: "c1", name: "Jorge Ceballos", phone: "+56 9 1234 5678", lastMessage: "¿Tienen hora para mañana?", time: "13:02", unread: 2, online: true },
  { id: "c2", name: "María Fernanda", phone: "+56 9 8765 4321", lastMessage: "Gracias, perfecto 😊", time: "12:40", unread: 0, online: false },
  { id: "c3", name: "Camila Rojas", phone: "+56 9 5555 1212", lastMessage: "¿Cuánto cuesta la limpieza facial?", time: "11:15", unread: 1, online: true },
  { id: "c4", name: "Sebastián Díaz", phone: "+56 9 4444 9090", lastMessage: "Ok, nos vemos el viernes", time: "Ayer", unread: 0, online: false },
  { id: "c5", name: "Valentina Soto", phone: "+56 9 3333 7878", lastMessage: "¿Dónde están ubicados?", time: "Ayer", unread: 0, online: false },
]

const MOCK_THREADS: Record<string, ChatMessage[]> = {
  c1: [
    { id: "m1", from: "contact", text: "Hola! ¿Tienen hora para mañana?", time: "13:00" },
    { id: "m2", from: "bot", text: "¡Hola Jorge! 👋 Sí, tenemos disponibilidad mañana. ¿Para qué servicio te gustaría agendar?", time: "13:00" },
    { id: "m3", from: "contact", text: "Para una limpieza facial", time: "13:02" },
  ],
  c2: [
    { id: "m1", from: "contact", text: "¿Me confirmas mi cita del jueves?", time: "12:38" },
    { id: "m2", from: "bot", text: "¡Claro! Tu cita está confirmada para el jueves a las 16:00 hrs. Te esperamos 💆‍♀️", time: "12:39" },
    { id: "m3", from: "contact", text: "Gracias, perfecto 😊", time: "12:40" },
  ],
  c3: [
    { id: "m1", from: "contact", text: "¿Cuánto cuesta la limpieza facial?", time: "11:15" },
  ],
  c4: [
    { id: "m1", from: "contact", text: "Ok, nos vemos el viernes", time: "Ayer" },
  ],
  c5: [
    { id: "m1", from: "contact", text: "¿Dónde están ubicados?", time: "Ayer" },
  ],
}

// Contexto del negocio (editable). Esto es lo que el bot "conoce" para responder.
const DEFAULT_CONTEXT = `Clínica: Medique Estética
Horario: Lun a Vie 09:00–19:00, Sáb 10:00–14:00
Dirección: Av. Providencia 1234, Santiago
Servicios y precios:
- Limpieza facial: $25.000
- Bioestimulación: $80.000
- Ácido hialurónico (labios): $180.000
Política: confirmar con 24h de anticipación.`

// Bot simulado — responde según palabras clave usando el contexto del negocio.
function simulateBotReply(userText: string): string {
  const t = userText.toLowerCase()
  if (/(precio|cuánto|cuanto|valor|costo|cuesta)/.test(t))
    return "Te cuento nuestros precios 💅: Limpieza facial $25.000, Bioestimulación $80.000 y Ácido hialurónico en labios $180.000. ¿Quieres que te agende alguno?"
  if (/(hora|horario|atien|abren|cierran|disponib)/.test(t))
    return "Nuestro horario es Lun a Vie de 09:00 a 19:00 y Sáb de 10:00 a 14:00. ¿Te busco un cupo disponible? 📅"
  if (/(reserv|agend|cita|hora para|tomar hora)/.test(t))
    return "¡Perfecto! Para agendar necesito tu nombre, el servicio y el día que prefieres. ¿Te acomoda mañana en la mañana o en la tarde?"
  if (/(direcci|dónde|donde|ubica|llegar)/.test(t))
    return "Estamos en Av. Providencia 1234, Santiago 📍. ¿Te comparto la ubicación en el mapa?"
  if (/(hola|buenas|buenos días|buenas tardes)/.test(t))
    return "¡Hola! 👋 Bienvenid@ a Medique Estética. ¿En qué puedo ayudarte hoy? Puedo darte precios, horarios o agendar tu hora."
  if (/(gracias|graciaa|genial|perfecto)/.test(t))
    return "¡Con gusto! 😊 Cualquier cosa quedo atent@. Que tengas un lindo día ✨"
  return "Entiendo 🙌. Soy el asistente de Medique Estética y puedo ayudarte con precios, horarios, ubicación o agendar tu hora. ¿Qué necesitas?"
}

const now = () => new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })

export function AiAgentView() {
  const [model, setModel] = useState(AGENT_MODELS[0].id)
  const [temperature, setTemperature] = useState(0.6)
  const [autoReply, setAutoReply] = useState(true)
  const [context, setContext] = useState(DEFAULT_CONTEXT)
  const [showContext, setShowContext] = useState(false)

  const [threads, setThreads] = useState<Record<string, ChatMessage[]>>(MOCK_THREADS)
  const [activeId, setActiveId] = useState<string | null>("c1")
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const [search, setSearch] = useState("")
  const [connected, setConnected] = useState(false)
  const [liveConvs, setLiveConvs] = useState<Conversation[] | null>(null)
  const [metrics, setMetrics] = useState<{ contacts: number; messages: number; bookingsByAI: number; responseRate: number } | null>(null)
  const [pausedMap, setPausedMap] = useState<Record<string, boolean>>({})
  const scrollRef = useRef<HTMLDivElement>(null)

  const activePaused = activeId ? !!pausedMap[activeId] : false

  const conversations = connected && liveConvs ? liveConvs : MOCK_CONVERSATIONS
  const activeConv = conversations.find((c) => c.id === activeId) || null
  const activeMessages = activeId ? threads[activeId] || [] : []
  const selectedModel = AGENT_MODELS.find((m) => m.id === model)!

  const filteredConvs = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  )

  // Detecta si el Agente IA ya está conectado (UltraMsg + IA) y, en ese caso,
  // carga las conversaciones reales en vez de las de ejemplo.
  useEffect(() => {
    let cancelled = false
    fetch("/api/whatsapp/metrics")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d) setMetrics(d) })
      .catch(() => {})
    fetch("/api/whatsapp/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d?.connected) return
        setConnected(true)
        fetch("/api/whatsapp/conversations")
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (cancelled || !data) return
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const convs: Conversation[] = (data.conversations || []).map((c: any) => ({
              id: c.phone,
              name: c.name || c.phone,
              phone: c.phone,
              lastMessage: c.lastMessage || "",
              time: c.time ? new Date(c.time).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }) : "",
              unread: 0,
              online: false,
            }))
            setLiveConvs(convs)
            setActiveId(convs[0]?.id ?? null)
          })
          .catch(() => {})
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [activeMessages.length, typing, activeId])

  const selectConversation = async (id: string) => {
    setActiveId(id)
    if (!connected) return
    try {
      const r = await fetch(`/api/whatsapp/conversations?phone=${encodeURIComponent(id)}`)
      if (!r.ok) return
      const d = await r.json()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msgs: ChatMessage[] = (d.messages || []).map((m: any) => ({
        id: m.id,
        from: m.direction === "in" ? "contact" : "bot",
        text: m.body,
        time: new Date(m.created_at).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
      }))
      setThreads((prev) => ({ ...prev, [id]: msgs }))
    } catch { /* noop */ }
  }

  const toggleHandoff = async () => {
    if (!activeId) return
    const next = !activePaused
    setPausedMap((prev) => ({ ...prev, [activeId]: next }))
    if (!connected) return
    try {
      await fetch("/api/whatsapp/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: activeId, paused: next }),
      })
    } catch { /* noop */ }
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || !activeId) return

    // MODO CONECTADO: el operador responde manualmente por WhatsApp real.
    if (connected) {
      const outMsg: ChatMessage = { id: `o-${Date.now()}`, from: "bot", text, time: now() }
      setThreads((prev) => ({ ...prev, [activeId]: [...(prev[activeId] || []), outMsg] }))
      setInput("")
      try {
        await fetch("/api/whatsapp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: activeId, message: text }),
        })
      } catch { /* noop */ }
      return
    }

    // MODO PROTOTIPO: simula al cliente escribiendo y la respuesta del bot.
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, from: "contact", text, time: now() }
    setThreads((prev) => ({ ...prev, [activeId]: [...(prev[activeId] || []), userMsg] }))
    setInput("")
    if (!autoReply) return
    setTyping(true)
    setTimeout(() => {
      const replyText = simulateBotReply(text)
      const botMsg: ChatMessage = { id: `b-${Date.now()}`, from: "bot", text: replyText, time: now() }
      setThreads((prev) => ({ ...prev, [activeId]: [...(prev[activeId] || []), botMsg] }))
      setTyping(false)
    }, 1100)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Agente IA"
        description="Bandeja de WhatsApp con un asistente inteligente que responde con el contexto de tu clínica."
        icon={Bot}
      >
        <Badge variant="secondary" className="bg-muted text-muted-foreground border border-border gap-1.5 h-7 px-3 rounded-full">
          <Circle className={`h-2 w-2 ${connected ? "fill-green-400 text-green-400" : "fill-amber-400 text-amber-400"}`} />
          {connected ? "Conectado" : "Prototipo"}
        </Badge>
        {!connected && (
          <Button className="bg-brand text-white hover:bg-brand-dark rounded-xl shadow-glow">
            <Plug className="h-4 w-4 mr-2" /> Conectar WhatsApp
          </Button>
        )}
      </PageHeader>

      {/* Aviso de estado */}
      {connected ? (
        <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
          <Circle className="h-5 w-5 shrink-0 mt-0.5 fill-green-500 text-green-500" />
          <p className="text-sm">
            <span className="font-semibold">WhatsApp conectado.</span> Las conversaciones y respuestas son reales. El bot responde
            automáticamente a los mensajes entrantes con el contexto de tu clínica.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <Sparkles className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
          <div className="text-sm space-y-2">
            <p>
              <span className="font-semibold">Modo prototipo.</span> Las conversaciones son de ejemplo y el bot responde con respuestas simuladas
              basadas en el contexto del negocio. Para activarlo de verdad: pon <code className="text-xs bg-amber-100 px-1 rounded">GROQ_API_KEY</code> + <code className="text-xs bg-amber-100 px-1 rounded">ULTRAMSG_INSTANCE_ID</code>/<code className="text-xs bg-amber-100 px-1 rounded">ULTRAMSG_TOKEN</code> en Vercel y registra esta URL de webhook en UltraMsg:
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <code className="text-xs font-mono bg-white border border-amber-200 rounded-lg px-2 py-1 break-all">
                {(typeof window !== "undefined" ? window.location.origin : "https://TU-DOMINIO")}/api/whatsapp/webhook
              </code>
              <button
                onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/api/whatsapp/webhook`); }}
                className="text-xs font-medium text-amber-700 hover:text-amber-900 underline"
              >
                Copiar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Métricas del bot */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(() => {
          const m = metrics || { contacts: 5, messages: 128, bookingsByAI: 12, responseRate: 96 }
          const cards = [
            { label: "Contactos", value: m.contacts, icon: Users, grad: "from-[#54707F] to-[#6E8A98]" },
            { label: "Mensajes (30d)", value: m.messages, icon: MessageCircle, grad: "from-[#2563EB] to-[#60A5FA]" },
            { label: "Citas por IA", value: m.bookingsByAI, icon: CalendarCheck, grad: "from-[#7C3AED] to-[#A78BFA]" },
            { label: "Tasa respuesta", value: `${m.responseRate}%`, icon: Percent, grad: "from-[#059669] to-[#34D399]" },
          ]
          return cards.map((c, i) => (
            <div key={i} className="rounded-2xl border border-border/70 bg-card shadow-soft p-4 flex items-center gap-3">
              <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${c.grad} flex items-center justify-center text-white shadow-soft shrink-0`}>
                <c.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold truncate">{c.label}</p>
                <p className="text-xl font-bold text-foreground">{c.value}</p>
              </div>
            </div>
          ))
        })()}
      </div>

      {/* Barra de parámetros del agente */}
      <div className="rounded-2xl border border-border/70 bg-card shadow-soft p-4 md:p-5">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          {/* Selector de modelo de IA */}
          <div className="flex-1 min-w-0">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5 mb-1.5">
              <Cpu className="h-3.5 w-3.5 text-brand" /> Modelo de IA
            </label>
            <div className="relative">
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full h-11 rounded-xl border border-input bg-background px-3.5 pr-10 text-sm font-medium outline-none transition-all focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/15 appearance-none cursor-pointer"
              >
                {AGENT_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} · {m.provider} ({m.tag})
                  </option>
                ))}
              </select>
              <Cpu className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
              <Badge
                variant="secondary"
                className={selectedModel.tag === "Gratis" ? "bg-brand-soft text-brand-dark" : "bg-muted text-muted-foreground"}
              >
                {selectedModel.tag}
              </Badge>
              {selectedModel.note}
            </p>
          </div>

          {/* Temperatura (creatividad) */}
          <div className="w-full lg:w-52">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5"><SlidersHorizontal className="h-3.5 w-3.5 text-brand" /> Creatividad</span>
              <span className="text-foreground tabular-nums">{temperature.toFixed(1)}</span>
            </label>
            <input
              type="range" min={0} max={1} step={0.1}
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-brand cursor-pointer"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Más bajo = preciso · Más alto = creativo</p>
          </div>

          {/* Auto-respuesta */}
          <div className="w-full lg:w-auto">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">Auto-respuesta</label>
            <button
              onClick={() => setAutoReply((v) => !v)}
              className={`flex items-center gap-2 h-11 px-4 rounded-xl border text-sm font-medium transition-all ${
                autoReply
                  ? "bg-brand-soft border-brand/30 text-brand-dark"
                  : "bg-background border-input text-muted-foreground"
              }`}
            >
              <Zap className={`h-4 w-4 ${autoReply ? "text-brand" : ""}`} />
              {autoReply ? "Bot activo" : "Bot pausado"}
            </button>
          </div>

          <Button
            variant="outline"
            className="h-11 rounded-xl"
            onClick={() => setShowContext((v) => !v)}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            {showContext ? "Ocultar contexto" : "Contexto del negocio"}
          </Button>
        </div>

        {showContext && (
          <div className="mt-4 pt-4 border-t border-border">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
              Contexto que conoce el agente (precios, horarios, dirección, políticas)
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={6}
              className="w-full rounded-xl border border-input bg-background px-3.5 py-3 text-sm outline-none transition-all focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/15 font-mono leading-relaxed"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              En la versión conectada, esto se combinará automáticamente con datos reales de tu base (pacientes, citas, servicios).
            </p>
          </div>
        )}
      </div>

      {/* Bandeja de chat */}
      <div className="rounded-2xl border border-border/70 bg-card shadow-soft overflow-hidden grid grid-cols-1 md:grid-cols-[280px_1fr] h-[calc(100vh-360px)] min-h-[520px]">
        {/* Lista de conversaciones */}
        <div className={`border-r border-border/70 flex flex-col min-h-0 ${activeId ? "hidden md:flex" : "flex"}`}>
          <div className="p-3 border-b border-border/70">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar conversación..."
                className="w-full h-10 rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/15"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto sidebar-scroll">
            {filteredConvs.map((c) => {
              const active = c.id === activeId
              return (
                <button
                  key={c.id}
                  onClick={() => selectConversation(c.id)}
                  className={`w-full text-left flex items-center gap-3 px-3 py-3 border-b border-border/50 transition-colors ${
                    active ? "bg-brand-soft/60" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="h-11 w-11 rounded-full bg-gradient-to-br from-[#54707F] to-[#6E8A98] flex items-center justify-center text-white font-semibold">
                      {c.name.charAt(0)}
                    </div>
                    {c.online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm text-foreground truncate">{c.name}</p>
                      <span className="text-[11px] text-muted-foreground shrink-0">{c.time}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground truncate">{c.lastMessage}</p>
                      {c.unread > 0 && (
                        <span className="shrink-0 h-5 min-w-5 px-1.5 rounded-full bg-brand text-white text-[11px] font-semibold flex items-center justify-center">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Panel de chat */}
        <div className={`flex flex-col min-h-0 ${activeId ? "flex" : "hidden md:flex"}`}>
          {activeConv ? (
            <>
              {/* Cabecera del chat */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border/70 bg-card">
                <button onClick={() => setActiveId(null)} className="md:hidden text-muted-foreground hover:text-foreground">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#54707F] to-[#6E8A98] flex items-center justify-center text-white font-semibold shrink-0">
                  {activeConv.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-foreground truncate">{activeConv.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Phone className="h-3 w-3" /> {activeConv.phone}
                    {activeConv.online && <span className="text-green-600">· en línea</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleHandoff}
                    title={activePaused ? "Reactivar el bot en este chat" : "Pasar a atención humana"}
                    className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium border transition-all ${
                      activePaused
                        ? "bg-amber-50 border-amber-200 text-amber-700"
                        : "bg-card border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {activePaused ? <Play className="h-3.5 w-3.5" /> : <Headset className="h-3.5 w-3.5" />}
                    {activePaused ? "Reactivar bot" : "Atender yo"}
                  </button>
                  <Badge variant="secondary" className={activePaused ? "bg-amber-100 text-amber-700 gap-1" : "bg-brand-soft text-brand-dark gap-1"}>
                    {activePaused ? <Pause className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                    {activePaused ? "Humano" : selectedModel.name}
                  </Badge>
                </div>
              </div>

              {/* Mensajes */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto sidebar-scroll p-4 space-y-3 bg-muted/30">
                {activeMessages.map((m) => (
                  <div key={m.id} className={`flex ${m.from === "bot" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-soft ${
                        m.from === "bot"
                          ? "bg-brand text-white rounded-br-md"
                          : "bg-card border border-border/70 text-foreground rounded-bl-md"
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                      <div className={`flex items-center gap-1 justify-end mt-1 text-[10px] ${m.from === "bot" ? "text-white/70" : "text-muted-foreground"}`}>
                        {m.time}
                        {m.from === "bot" && <CheckCheck className="h-3 w-3" />}
                      </div>
                    </div>
                  </div>
                ))}
                {typing && (
                  <div className="flex justify-end">
                    <div className="bg-brand/90 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-soft">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 rounded-full bg-white/80 animate-bounce [animation-delay:-0.3s]" />
                        <span className="h-2 w-2 rounded-full bg-white/80 animate-bounce [animation-delay:-0.15s]" />
                        <span className="h-2 w-2 rounded-full bg-white/80 animate-bounce" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Entrada */}
              <div className="p-3 border-t border-border/70 bg-card">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {QUICK_REPLIES.map((q) => (
                    <button
                      key={q.label}
                      onClick={() => setInput(q.text)}
                      className="text-xs px-2.5 py-1 rounded-full border border-border bg-muted/40 hover:bg-brand-soft hover:border-brand/30 hover:text-brand-dark transition-colors"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-end gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    placeholder="Escribe un mensaje para probar el bot..."
                    className="flex-1 h-11 rounded-xl border border-input bg-background px-4 text-sm outline-none focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/15"
                  />
                  <Button onClick={handleSend} disabled={!input.trim()} className="bg-brand text-white hover:bg-brand-dark rounded-xl shadow-glow h-11 w-11 p-0">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5">
                  <RefreshCw className="h-3 w-3" />
                  Respuesta simulada con <span className="font-medium text-foreground">{selectedModel.name}</span>. Conecta tu API para respuestas reales.
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="h-16 w-16 rounded-2xl bg-brand-soft flex items-center justify-center mb-4">
                <MessageCircle className="h-8 w-8 text-brand" />
              </div>
              <h3 className="font-semibold text-foreground">Selecciona una conversación</h3>
              <p className="text-sm text-muted-foreground max-w-xs mt-1">
                Elige un chat de la izquierda para ver los mensajes y probar las respuestas del agente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
