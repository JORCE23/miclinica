import Link from "next/link"
import { Sparkles, Camera, FileSignature, Gift, CalendarCheck, ScanFace, Check, ArrowRight } from "lucide-react"
import { Reveal, Stagger, StaggerItem } from "@/components/marketing/motion"

export const metadata = {
  title: "Software para clínicas de estética",
  description: "Agenda, fichas con fotos antes/después, análisis facial Ricketts, consentimientos y fidelización. Prueba gratis 14 días.",
}

const features = [
  { icon: ScanFace, title: "Análisis facial estético", desc: "Plano de Ricketts y proporción áurea sobre la foto del paciente. Sorprende en la consulta y justifica el tratamiento." },
  { icon: Camera, title: "Fotos antes / después", desc: "Documenta cada procedimiento con imágenes ordenadas en la ficha. Ideal para botox, ácido hialurónico y más." },
  { icon: FileSignature, title: "Consentimientos digitales", desc: "Firma de consentimientos informados desde el celular. Sin papeles, todo respaldado." },
  { icon: CalendarCheck, title: "Agenda y recordatorios", desc: "Reservas online y recordatorios por WhatsApp para reducir las inasistencias." },
  { icon: Gift, title: "Fidelización Glow Points", desc: "Premia a tus pacientes y haz que vuelvan por sus mantenciones." },
  { icon: Sparkles, title: "Procedimientos estéticos", desc: "Registra tratamientos, zonas y dosis. Tu historial clínico estético, completo." },
]

export default function EsteticaPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-brand-panel text-white pt-28 md:pt-32 pb-20 md:pb-28">
        <div className="aurora-bg opacity-70" />
        <div className="absolute inset-0 bg-grid opacity-50" />
        <Reveal className="relative mx-auto max-w-6xl px-5 text-center">
          <span className="inline-flex items-center gap-2 rounded-full glass-panel px-4 py-1.5 text-xs font-medium text-brand-light mb-6">
            <Sparkles className="h-3.5 w-3.5" /> Para clínicas de estética
          </span>
          <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05] max-w-3xl mx-auto">
            El software que entiende tu <span className="text-shine">clínica estética</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-white/75 max-w-2xl mx-auto leading-relaxed">
            Fichas con fotos antes/después, análisis facial, consentimientos digitales y fidelización.
            Todo pensado para estética, no un genérico adaptado.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/crear-cuenta" className="inline-flex h-12 items-center gap-2 px-7 rounded-xl text-base font-semibold bg-brand text-white hover:bg-brand-dark shadow-glow transition-all">
              Prueba gratis 14 días <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/planes" className="inline-flex h-12 items-center px-7 rounded-xl text-base font-semibold glass-panel text-white hover:bg-white/15 transition-all">
              Ver planes
            </Link>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 md:py-24">
        <Reveal className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground tracking-tight">Hecho para la consulta estética</h2>
        </Reveal>
        <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <StaggerItem key={f.title} className="rounded-2xl border border-border bg-card p-6 shadow-soft hover-lift">
              <div className="h-11 w-11 rounded-xl bg-brand/10 text-brand flex items-center justify-center mb-4">
                <f.icon className="h-[22px] w-[22px]" />
              </div>
              <h3 className="font-semibold text-foreground mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="bg-card border-y border-border/70">
        <div className="mx-auto max-w-5xl px-5 py-20 grid md:grid-cols-2 gap-12 items-center">
          <ul className="space-y-3">
            {[
              "Tu propia página de reservas para que agenden online",
              "Recordatorios por WhatsApp que reducen inasistencias",
              "Marketing y campañas para atraer pacientes nuevos",
              "Fidelización incluida para que vuelvan",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 rounded-xl border border-border bg-background p-4">
                <Check className="h-5 w-5 text-brand shrink-0 mt-0.5" />
                <span className="text-foreground font-medium">{t}</span>
              </li>
            ))}
          </ul>
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground tracking-tight">Llena tu agenda, no solo la organices</h2>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
              Medique no es solo gestión: incluye las herramientas y los servicios de marketing para que lleguen pacientes nuevos y los que tienes vuelvan.
            </p>
            <Link href="/planes" className="mt-7 inline-flex h-11 items-center gap-2 px-6 rounded-xl text-sm font-semibold bg-brand text-white hover:bg-brand-dark shadow-soft transition-colors">
              Ver planes y precios <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 text-center">
        <h2 className="font-display text-3xl md:text-5xl font-semibold text-foreground tracking-tight max-w-2xl mx-auto">Empieza gratis hoy</h2>
        <p className="mt-4 text-muted-foreground text-lg">14 días de prueba, sin tarjeta.</p>
        <Link href="/crear-cuenta" className="mt-8 inline-flex h-12 items-center gap-2 px-8 rounded-xl text-base font-semibold bg-brand text-white hover:bg-brand-dark shadow-glow transition-all">
          Crear mi cuenta <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </>
  )
}
