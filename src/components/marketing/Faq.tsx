"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Plus } from "lucide-react"

const faqs = [
  { q: "¿Necesito tarjeta de crédito para probar?", a: "No. Creas tu cuenta y usas Medique gratis por 14 días sin ingresar ningún medio de pago. Solo pagas si decides quedarte." },
  { q: "¿Sirve para mi tipo de clínica?", a: "Sí. Medique funciona para estética, dental, médica, kinesiología, psicología, nutrición, veterinaria y belleza. El mismo sistema potente, adaptado a tu especialidad." },
  { q: "¿La página de reservas viene incluida?", a: "Sí. Cada clínica recibe su propia página de reservas online para que sus pacientes agenden solos, incluida en todos los planes. No pagas otra herramienta aparte." },
  { q: "¿Puedo cambiar o cancelar mi plan cuando quiera?", a: "Claro. Subes, bajas o cancelas tu plan en cualquier momento desde tu panel, sin contratos ni permanencia." },
  { q: "¿Qué pasa con mis datos y los de mis pacientes?", a: "Tu información está segura y respaldada. Cada clínica tiene su espacio aislado y privado, y puedes exportar tus datos cuando quieras." },
  { q: "¿Ofrecen ayuda con el marketing?", a: "Sí. Además del software, tenemos servicios de Meta Ads, gestión de Instagram y asesoría 1-a-1 para llenar tu agenda con pacientes nuevos." },
]

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="mx-auto max-w-3xl divide-y divide-border rounded-2xl border border-border bg-card">
      {faqs.map((f, i) => {
        const isOpen = open === i
        return (
          <div key={i}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-4 text-left px-6 py-5 hover:bg-muted/40 transition-colors"
            >
              <span className="font-medium text-foreground">{f.q}</span>
              <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.2 }} className="shrink-0 text-brand">
                <Plus className="h-5 w-5" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-5 text-muted-foreground leading-relaxed">{f.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
