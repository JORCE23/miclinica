"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Handshake, Check } from "lucide-react"

const inputCls = "w-full h-11 rounded-xl border border-input bg-white px-3.5 text-sm outline-none transition-all focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15"

export default function ColaborarPage() {
  const params = useParams()
  const slug = String(params?.slug || "")
  const [clinicName, setClinicName] = useState("")
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "", message: "" })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`/api/public/clinics/${slug}`).then((r) => r.ok ? r.json() : null).then((c) => c && setClinicName(c.name)).catch(() => {})
  }, [slug])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError("Tu nombre es obligatorio"); return }
    setSending(true); setError("")
    try {
      const r = await fetch("/api/public/collaborations", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, ...form }),
      })
      if (!r.ok) throw new Error()
      setSent(true)
    } catch {
      setError("No se pudo enviar. Intenta de nuevo.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F2EC] flex items-center justify-center p-5">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto mb-3">
            <Handshake className="h-6 w-6" />
          </div>
          <h1 className="font-serif text-3xl font-semibold text-[#17170F]" style={{ fontFamily: "Georgia, serif" }}>Colabora con {clinicName || "la clínica"}</h1>
          <p className="text-sm text-[#5C5A50] mt-1.5">Cuéntanos sobre ti y cómo te gustaría colaborar. Te contactaremos.</p>
        </div>

        {sent ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="h-14 w-14 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-4">
              <Check className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-[#17170F]">¡Gracias!</h2>
            <p className="text-sm text-[#5C5A50] mt-1.5">Recibimos tu postulación. Nos pondremos en contacto pronto. ✨</p>
          </div>
        ) : (
          <form onSubmit={submit} className="bg-white rounded-2xl shadow-lg p-6 space-y-3.5">
            <input className={inputCls} placeholder="Nombre completo *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <input className={inputCls} placeholder="Correo" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input className={inputCls} placeholder="Teléfono / WhatsApp" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <input className={inputCls} placeholder="¿En qué te gustaría colaborar? (ej. fotografía, marketing…)" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            <textarea className={`${inputCls} h-28 py-2.5`} placeholder="Cuéntanos más…" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button type="submit" disabled={sending} className="w-full h-11 rounded-xl bg-[#17170F] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
              {sending ? "Enviando…" : "Enviar postulación"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
