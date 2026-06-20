import Link from "next/link"
import { Check, ArrowRight, Megaphone, GraduationCap, Globe, Share2 } from "lucide-react"
import { Reveal, Stagger, StaggerItem } from "@/components/marketing/motion"

export const metadata = {
  title: "Planes y precios",
  description: "Planes simples y todo incluido para tu clínica. Desde $34.900/mes. Prueba gratis 14 días.",
}

const plans = [
  {
    name: "Esencial",
    price: "$34.900",
    tagline: "Para esteticistas y clínicas de 1 a 3 profesionales",
    featured: false,
    features: [
      "Hasta 3 profesionales",
      "Agenda y reservas online 24/7",
      "Tu página de reservas propia",
      "Ficha de pacientes",
      "Recordatorios por WhatsApp",
      "Caja e ingresos",
      "Fidelización Glow Points",
      "Soporte por chat",
    ],
  },
  {
    name: "Profesional",
    price: "$59.900",
    tagline: "Para clínicas en crecimiento de 3 a 6 profesionales",
    featured: true,
    features: [
      "Todo lo de Esencial, y además:",
      "Hasta 6 profesionales",
      "Copiloto con IA",
      "Inventario y servicios",
      "Análisis facial estético (Ricketts)",
      "Reportes y métricas",
      "Múltiples agendas",
    ],
  },
  {
    name: "Clínica",
    price: "$99.000",
    tagline: "Para clínicas medianas de 4 a 15 profesionales",
    featured: false,
    features: [
      "Todo lo de Profesional, y además:",
      "Profesionales ilimitados",
      "Multi-box y multi-sucursal",
      "Automatización de marketing",
      "Roles y permisos avanzados",
      "Soporte prioritario",
    ],
  },
]

const addons = [
  { icon: Megaphone, name: "Meta Ads gestionado", price: "$290.000/mes", desc: "Creamos y optimizamos tus campañas de Facebook e Instagram. (La pauta se paga aparte.)" },
  { icon: GraduationCap, name: "Auditoría 1-a-1", price: "$180.000/mes", desc: "Consultoría mensual personalizada + calendario de contenido: qué publicar cada día." },
  { icon: Share2, name: "Gestión de Instagram", price: "$290.000/mes", desc: "Diseño de feed, contenido y crecimiento de seguidores hecho por nosotros." },
  { icon: Globe, name: "Landing premium", price: "$19.000/mes", desc: "Página con tu dominio propio y diseño a medida. (La página de reservas básica va incluida.)" },
]

export default function PlanesPage() {
  return (
    <>
      {/* Encabezado */}
      <section className="relative overflow-hidden bg-brand-panel text-white pt-28 md:pt-32 pb-16 md:pb-20">
        <div className="aurora-bg opacity-60" />
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="relative mx-auto max-w-6xl px-5 text-center">
          <Reveal>
            <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-tight">Planes simples, <span className="text-shine">todo incluido</span></h1>
            <p className="mt-5 text-white/75 text-lg max-w-2xl mx-auto">
              Sin costos ocultos. La página de reservas, la fidelización y los recordatorios vienen en todos los planes.
            </p>
            <p className="mt-5 inline-flex items-center gap-2 rounded-full glass-panel px-4 py-1.5 text-sm font-medium text-brand-light">
              Paga anual y llévate 2 meses gratis
            </p>
          </Reveal>
        </div>
      </section>

      {/* Planes */}
      <section className="mx-auto max-w-6xl px-5 -mt-10 md:-mt-12 pb-8">
        <Stagger className="grid md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <StaggerItem
              key={p.name}
              className={`relative rounded-2xl bg-card p-7 flex flex-col ${
                p.featured ? "border-2 border-brand shadow-elevated md:-translate-y-2" : "border border-border shadow-soft"
              }`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand text-white text-xs font-semibold px-3 py-1 shadow-soft">
                  Más popular
                </span>
              )}
              <h3 className="font-display text-2xl font-semibold text-foreground">{p.name}</h3>
              <p className="text-sm text-muted-foreground mt-1 min-h-[40px]">{p.tagline}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-semibold text-foreground">{p.price}</span>
                <span className="text-muted-foreground text-sm">/mes</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">IVA incluido</p>
              <Link
                href="/crear-cuenta"
                className={`mt-6 inline-flex h-11 items-center justify-center gap-2 px-5 rounded-xl text-sm font-semibold transition-colors ${
                  p.featured ? "bg-brand text-white hover:bg-brand-dark shadow-soft" : "border border-border text-foreground hover:bg-muted"
                }`}
              >
                Empezar gratis <ArrowRight className="h-4 w-4" />
              </Link>
              <ul className="mt-7 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className={`flex items-start gap-2.5 text-sm ${f.endsWith(":") ? "font-semibold text-foreground pt-1" : "text-muted-foreground"}`}>
                    {!f.endsWith(":") && <Check className="h-[18px] w-[18px] text-brand shrink-0 mt-0.5" />}
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </StaggerItem>
          ))}
        </Stagger>
        <p className="text-center text-sm text-muted-foreground mt-8">
          ¿Clínica con varias sucursales o necesitas algo a medida? <Link href="/crear-cuenta" className="text-brand font-medium hover:underline">Hablemos</Link>.
        </p>
      </section>

      {/* Add-ons de marketing */}
      <section className="bg-card border-y border-border/70 mt-10">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground tracking-tight">Potencia tu clínica con marketing</h2>
            <p className="mt-4 text-muted-foreground text-lg">Servicios gestionados por nuestro equipo. Se suman a cualquier plan cuando quieras llenar tu agenda.</p>
          </div>
          <Stagger className="grid sm:grid-cols-2 gap-5">
            {addons.map((a) => (
              <StaggerItem key={a.name} className="rounded-2xl border border-border bg-background p-6 flex gap-4 hover-lift">
                <div className="h-11 w-11 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                  <a.icon className="h-[22px] w-[22px]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{a.name}</h3>
                    <span className="text-sm font-semibold text-brand">{a.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{a.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 py-20 text-center">
        <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground tracking-tight">Pruébalo gratis por 14 días</h2>
        <p className="mt-4 text-muted-foreground text-lg">Sin tarjeta de crédito. Configura tu clínica en minutos.</p>
        <Link href="/crear-cuenta" className="mt-8 inline-flex h-12 items-center gap-2 px-8 rounded-xl text-base font-semibold bg-brand text-white hover:bg-brand-dark shadow-glow transition-all">
          Crear mi cuenta <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </>
  )
}
