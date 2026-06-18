"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { SignaturePad, type SignaturePadHandle } from "@/components/admin/patients/SignaturePad"
import { FileSignature, Check, Eraser } from "lucide-react"

type ConsentData = {
  title: string; body: string | null; clinic_name: string; clinic_logo: string | null
  patient_name: string | null; already_signed: boolean
}

export default function ConsentSignPage() {
  const params = useParams()
  const token = String(params?.token || "")
  const padRef = useRef<SignaturePadHandle>(null)
  const [data, setData] = useState<ConsentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`/api/public/consents/${token}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => { setData(d); if (d.already_signed) setDone(true) })
      .catch(() => setError("No se encontró el consentimiento."))
      .finally(() => setLoading(false))
  }, [token])

  const sign = async () => {
    if (!padRef.current || padRef.current.isEmpty()) { setError("Por favor firma en el recuadro."); return }
    setSaving(true); setError("")
    try {
      const r = await fetch(`/api/public/consents/${token}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature: padRef.current.toDataURL() }),
      })
      const d = await r.json()
      if (!r.ok) { setError(d?.error || "No se pudo firmar."); return }
      setDone(true)
    } catch {
      setError("No se pudo firmar. Intenta de nuevo.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-[#F5F2EC] flex items-center justify-center text-[#5C5A50]">Cargando…</div>

  return (
    <div className="min-h-screen bg-[#F5F2EC] flex items-center justify-center p-5">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-5">
          <div className="h-12 w-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto mb-3">
            <FileSignature className="h-6 w-6" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-[#17170F]" style={{ fontFamily: "Georgia, serif" }}>{data?.clinic_name || "Consentimiento"}</h1>
        </div>

        {error && !data ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center text-red-600">{error}</div>
        ) : done ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="h-14 w-14 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-4">
              <Check className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-[#17170F]">Consentimiento firmado</h2>
            <p className="text-sm text-[#5C5A50] mt-1.5">Gracias{data?.patient_name ? `, ${data.patient_name.split(" ")[0]}` : ""}. Tu firma quedó registrada. ✨</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[#17170F]">{data?.title}</h2>
            {data?.patient_name && <p className="text-sm text-[#5C5A50]">Paciente: <span className="font-medium text-[#17170F]">{data.patient_name}</span></p>}
            {data?.body && <div className="text-sm text-[#3a3a32] leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto border border-[#E5E0D6] rounded-xl p-4 bg-[#FAF8F3]">{data.body}</div>}

            <div>
              <p className="text-sm font-medium text-[#17170F] mb-2">Firma aquí:</p>
              <SignaturePad ref={padRef} />
              <button onClick={() => padRef.current?.clear()} className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#5C5A50] hover:text-[#17170F]">
                <Eraser className="h-3.5 w-3.5" /> Borrar firma
              </button>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button onClick={sign} disabled={saving} className="w-full h-11 rounded-xl bg-[#17170F] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
              {saving ? "Registrando…" : "Firmar consentimiento"}
            </button>
            <p className="text-[11px] text-[#9a9486] text-center">Al firmar declaras haber leído y aceptado este consentimiento.</p>
          </div>
        )}
      </div>
    </div>
  )
}
