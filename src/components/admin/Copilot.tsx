"use client"

import { useEffect, useRef, useState } from "react"
import { Sparkles, X, Send, Bot, Mic, Square, Loader2, Volume2, VolumeX } from "lucide-react"
import { cn } from "@/lib/utils"

type Msg = { role: "user" | "assistant"; content: string }

const WELCOME: Msg = {
  role: "assistant",
  content: "¡Hola! Soy tu Copilot ✨. Puedo ayudarte a usar Medique, agendar citas, buscar pacientes o redactar mensajes. Escríbeme o háblame con el micrófono.",
}

const SUGGESTIONS = [
  "¿Cómo agendo una cita?",
  "Redacta un recordatorio de cita",
  "¿Dónde está el link de reserva?",
]

export function Copilot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([WELCOME])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [voiceMode, setVoiceMode] = useState(false)
  const [speaking, setSpeaking] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const voiceModeRef = useRef(false)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, open, loading])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150)
  }, [open])

  // Mantener el modo voz en un ref (para callbacks) y precargar las voces del navegador
  useEffect(() => {
    voiceModeRef.current = voiceMode
    if (!voiceMode && typeof window !== "undefined") window.speechSynthesis?.cancel()
  }, [voiceMode])

  useEffect(() => {
    if (typeof window !== "undefined") window.speechSynthesis?.getVoices()
    return () => { if (typeof window !== "undefined") window.speechSynthesis?.cancel() }
  }, [])

  // El Copilot lee en voz alta su respuesta (español)
  const speak = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text.replace(/[*_#`]/g, ""))
    u.lang = "es-ES"
    const voices = window.speechSynthesis.getVoices()
    const esVoice = voices.find((v) => v.lang?.toLowerCase().startsWith("es"))
    if (esVoice) u.voice = esVoice
    u.rate = 1.05
    u.onstart = () => setSpeaking(true)
    u.onend = () => setSpeaking(false)
    u.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(u)
  }

  const send = async (text: string) => {
    const content = text.trim()
    if (!content || loading) return
    const next: Msg[] = [...messages, { role: "user", content }]
    setMessages(next)
    setInput("")
    setLoading(true)
    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.filter((m) => m !== WELCOME) }),
      })
      const data = await res.json()
      const reply = data.reply || "…"
      setMessages((m) => [...m, { role: "assistant", content: reply }])
      if (voiceModeRef.current) speak(reply)
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "No pude conectar. Intenta de nuevo." }])
    } finally {
      setLoading(false)
    }
  }

  // Grabación de voz → transcripción (Whisper/Groq)
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" })
        if (!blob.size) return
        setTranscribing(true)
        try {
          const fd = new FormData()
          fd.append("file", blob, "audio.webm")
          const r = await fetch("/api/transcribe", { method: "POST", body: fd })
          const d = await r.json()
          if (r.ok && d.text) {
            if (voiceModeRef.current) send(d.text)               // modo voz: envía solo
            else setInput((prev) => (prev ? prev.trim() + " " : "") + d.text)  // si no, lo deja para revisar
          }
        } catch { /* noop */ }
        finally { setTranscribing(false); if (!voiceModeRef.current) setTimeout(() => inputRef.current?.focus(), 50) }
      }
      recorderRef.current = mr
      mr.start()
      setRecording(true)
    } catch {
      alert("No se pudo acceder al micrófono. Revisa los permisos del navegador.")
    }
  }

  const toggleMic = () => {
    if (recording) {
      recorderRef.current?.stop()
      setRecording(false)
    } else {
      if (typeof window !== "undefined") window.speechSynthesis?.cancel()
      startRecording()
    }
  }

  return (
    <>
      {/* Panel de chat */}
      {open && (
        <div className="fixed bottom-24 right-5 z-[60] w-[min(380px,calc(100vw-2.5rem))] h-[min(560px,calc(100vh-9rem))] flex flex-col rounded-2xl border border-border bg-card shadow-elevated overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-brand-panel text-white shrink-0">
            <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Sparkles className="h-[18px] w-[18px] text-brand-light" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">Copilot</p>
              <p className="text-[11px] text-white/60 leading-tight">{speaking ? "Hablando…" : voiceMode ? "Modo voz activo" : "Asistente de Medique"}</p>
            </div>
            <button
              onClick={() => setVoiceMode((v) => !v)}
              className={cn("h-8 w-8 rounded-lg flex items-center justify-center transition-colors", voiceMode ? "bg-white/20 text-white" : "text-white/70 hover:text-white hover:bg-white/10")}
              title={voiceMode ? "Desactivar modo voz" : "Activar modo voz (te responde hablando)"}
            >
              {voiceMode ? <Volume2 className="h-[18px] w-[18px]" /> : <VolumeX className="h-[18px] w-[18px]" />}
            </button>
            <button onClick={() => { setOpen(false); window.speechSynthesis?.cancel() }} className="h-8 w-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors" title="Cerrar">
              <X className="h-[18px] w-[18px]" />
            </button>
          </div>

          {/* Mensajes */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-muted/20">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                {m.role === "assistant" && (
                  <div className="h-7 w-7 rounded-lg bg-brand/10 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                    <Bot className="h-4 w-4 text-brand" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                    m.role === "user"
                      ? "bg-brand text-white rounded-br-md"
                      : "bg-card border border-border text-foreground rounded-bl-md"
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="h-7 w-7 rounded-lg bg-brand/10 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                  <Bot className="h-4 w-4 text-brand" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-bl-md px-3.5 py-3 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" />
                </div>
              </div>
            )}

            {/* Sugerencias iniciales */}
            {messages.length === 1 && !loading && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:text-brand hover:border-brand/40 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border bg-card shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    send(input)
                  }
                }}
                rows={1}
                placeholder={recording ? "Grabando… toca ■ para enviar" : transcribing ? "Transcribiendo…" : voiceMode ? "Habla con el micrófono…" : "Escribe o usa el micrófono…"}
                className="flex-1 resize-none max-h-28 rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition-all focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15"
              />
              <button
                onClick={toggleMic}
                disabled={transcribing || loading}
                className={cn(
                  "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 disabled:pointer-events-none",
                  recording ? "bg-red-500 text-white hover:bg-red-600 animate-pulse" : "border border-border text-muted-foreground hover:text-brand hover:border-brand/40"
                )}
                title={recording ? "Detener y enviar" : "Hablar"}
              >
                {transcribing ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : recording ? <Square className="h-[16px] w-[16px]" /> : <Mic className="h-[18px] w-[18px]" />}
              </button>
              <button
                onClick={() => send(input)}
                disabled={loading || !input.trim()}
                className="h-10 w-10 shrink-0 rounded-xl bg-brand text-white flex items-center justify-center hover:bg-brand-dark transition-colors disabled:opacity-40 disabled:pointer-events-none"
                title="Enviar"
              >
                <Send className="h-[18px] w-[18px]" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground/70 mt-1.5 text-center">
              {voiceMode ? "Modo voz: hablas y el Copilot te responde en voz alta." : "El Copilot puede equivocarse. Verifica la información importante."}
            </p>
          </div>
        </div>
      )}

      {/* Botón flotante */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-[60] h-14 w-14 rounded-full bg-brand text-white shadow-glow flex items-center justify-center hover:bg-brand-dark transition-all hover:scale-105 active:scale-95"
        title={open ? "Cerrar Copilot" : "Abrir Copilot"}
        aria-label="Copilot"
      >
        {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-background" />
        )}
      </button>
    </>
  )
}
