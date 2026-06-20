import Link from "next/link"
import {
  CalendarCheck, Users, Globe, Sparkles, Wallet, Gift, BarChart3, Bot,
  Stethoscope, Scissors, Brain, Apple, PawPrint, Smile, Check, ArrowRight, Star, ScanFace, Megaphone,
} from "lucide-react"
import { Reveal, Stagger, StaggerItem, CountUp } from "@/components/marketing/motion"
import { HeroVisual } from "@/components/marketing/HeroVisual"
import { Faq } from "@/components/marketing/Faq"

export const metadata = {
  title: "Software + Marketing para tu clínica",
  description: "Agenda, pacientes, tu propia página de reservas, fidelización y marketing en un solo sistema. Prueba gratis 14 días.",
}

const verticals = [
  { icon: Sparkles, label: "Estética" }, { icon: Smile, label: "Dental" },
  { icon: Stethoscope, label: "Médica" }, { icon: Brain, label: "Psicología" },
  { icon: Apple, label: "Nutrición" }, { icon: Scissors, label: "Belleza" },
  { icon: PawPrint, label: "Veterinaria" }, { icon: Users, label: "Kinesiología" },
]

const steps = [
  { n: "01", title: "Crea tu cuenta gratis", desc: "En 2 minutos tienes tu clínica lista. Sin tarjeta, sin instalaciones." },
  { n: "02", title: "Configura tu clínica", desc: "Un asistente te guía: servicios, horarios y tu página de reservas." },
  { n: "03", title: "Recibe reservas y crece", desc: "Comparte tu link, llena tu agenda y atrae pacientes con marketing." },
]

const planPeek = [
  { name: "Esencial", price: "$34.900", who: "Solo / 1-3 profesionales", featured: false },
  { name: "Profesional", price: "$59.900", who: "Clínica de 3-6 profesionales", featured: true },
  { name: "Clínica", price: "$99.000", who: "Mediana, 4-15 profesionales", featured: false },
]

export default function MarketingHome() {
  return (
    <>
      {/* ===================== HERO ===================== */}
      <section className="relative overflow-hidden bg-brand-panel text-white pt-28 md:pt-32 pb-20 md:pb-28">
        <div className="aurora-bg opacity-70" />
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="relative mx-auto max-w-6xl px-5 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Texto */}
          <div className="text-center lg:text-left">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full glass-panel px-4 py-1.5 text-xs font-medium text-brand-light mb-6">
                <span className="relative flex h-2 w-2 text-brand-light"><span className="pulse-dot absolute inline-flex h-full w-full rounded-full" /><span className="relative inline-flex rounded-full h-2 w-2 bg-brand-light" /></span>
                Software + Marketing para tu clínica
              </span>
            </Reveal>
            <Reveal delay={0.06}>
              <h1 className="font-display text-5xl md:text-6xl lg:text-[4.2rem] font-semibold tracking-tight leading-[1.02]">
                Tu clínica, <span className="text-shine">impecable</span> y llena
              </h1>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-6 text-lg md:text-xl text-white/75 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Agenda, pacientes, tu propia página de reservas, fidelización y marketing.
                Todo en un solo lugar — sin armar el rompecabezas con cinco herramientas.
              </p>
            </Reveal>
            <Reveal delay={0.18}>
              <div className="mt-9 flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-3">
                <Link href="/crear-cuenta" className="group inline-flex h-13 items-center gap-2 px-8 py-3.5 rounded-2xl text-base font-semibold bg-brand text-white hover:bg-brand-dark glow-strong transition-all">
                  Prueba gratis 14 días <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/planes" className="inline-flex h-13 items-center px-8 py-3.5 rounded-2xl text-base font-semibold glass-panel text-white hover:bg-white/15 transition-all">
                  Ver planes
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.24}>
              <div className="mt-7 flex items-center justify-center lg:justify-start gap-5 text-sm text-white/60">
                <span className="flex items-center gap-1">{[0,1,2,3,4].map(i => <Star key={i} className="h-4 w-4 fill-brand-light text-brand-light" />)}</span>
                <span>Sin tarjeta · Cancela cuando quieras</span>
              </div>
            </Reveal>
          </div>
          {/* Visual */}
          <div className="relative">
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* ===================== MARQUEE ===================== */}
      <section className="border-y border-border/70 bg-card py-6 overflow-hidden">
        <div className="mask-fade-x">
          <div className="marquee-track gap-10">
            {[...verticals, ...verticals].map((v, i) => (
              <span key={i} className="flex items-center gap-2.5 text-muted-foreground whitespace-nowrap">
                <v.icon className="h-5 w-5 text-brand" />
                <span className="font-medium">{v.label}</span>
                <span className="ml-6 text-border">•</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== STATS ===================== */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { v: <><CountUp to={30} />+</>, l: "Funciones incluidas" },
            { v: <><CountUp to={14} /> días</>, l: "De prueba gratis" },
            { v: <><CountUp to={24} />/7</>, l: "Reservas online" },
            { v: <>100%</>, l: "En la nube, sin instalar" },
          ].map((s, i) => (
            <StaggerItem key={i}>
              <div className="font-display text-4xl md:text-5xl font-semibold text-brand-dark">{s.v}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.l}</div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ===================== BENTO FUNCIONES ===================== */}
      <section id="funciones" className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <Reveal className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-foreground tracking-tight">Todo incluido, sin sorpresas</h2>
          <p className="mt-4 text-muted-foreground text-lg">Otros te cobran aparte el WhatsApp, la web y la fidelización. Aquí viene todo en el mismo plan.</p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-5 auto-rows-[minmax(0,1fr)]">
          {/* Card grande */}
          <Reveal className="md:col-span-2 md:row-span-2">
            <div className="sheen relative h-full rounded-3xl border border-border bg-gradient-to-br from-brand/[0.07] to-card p-8 shadow-soft overflow-hidden">
              <div className="h-12 w-12 rounded-2xl bg-brand text-white flex items-center justify-center mb-5 glow-soft"><Globe className="h-6 w-6" /></div>
              <h3 className="font-display text-2xl font-semibold text-foreground mb-2">Tu página de reservas propia</h3>
              <p className="text-muted-foreground leading-relaxed max-w-md">Cada clínica recibe su propia web de reservas lista para compartir. Tus pacientes agendan solos, 24/7. Sin pagar otra herramienta aparte.</p>
              <div className="mt-6 rounded-2xl border border-border bg-background p-4 max-w-sm">
                <div className="flex items-center gap-2 mb-3"><div className="h-7 w-7 rounded-lg bg-brand/15" /><div className="h-2.5 w-28 rounded bg-slate-200" /></div>
                <div className="grid grid-cols-4 gap-1.5">{[...Array(8)].map((_,i)=><div key={i} className={`h-8 rounded-lg ${i===2||i===5?"bg-brand/80":"bg-slate-100"}`} />)}</div>
              </div>
            </div>
          </Reveal>

          {[
            { icon: CalendarCheck, title: "Agenda inteligente", desc: "Reservas, recordatorios por WhatsApp y menos inasistencias." },
            { icon: Bot, title: "Copiloto con IA", desc: "Un asistente que agenda y resuelve, como una recepcionista 24/7." },
            { icon: ScanFace, title: "Análisis facial", desc: "Plano de Ricketts y proporción áurea sobre la foto del paciente." },
            { icon: Gift, title: "Fidelización Glow Points", desc: "Premia con puntos y haz que tus pacientes vuelvan." },
          ].map((f, i) => (
            <Reveal key={f.title} delay={i * 0.05}>
              <div className="sheen h-full rounded-3xl border border-border bg-card p-6 shadow-soft hover-lift">
                <div className="h-11 w-11 rounded-xl bg-brand/10 text-brand flex items-center justify-center mb-4"><f.icon className="h-[22px] w-[22px]" /></div>
                <h3 className="font-semibold text-foreground mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Fila secundaria */}
        <Stagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-5">
          {[
            { icon: Users, title: "Ficha de pacientes", desc: "Historial, fotos antes/después y consentimientos digitales." },
            { icon: Wallet, title: "Caja e ingresos", desc: "Cuánto entra por día, servicio y profesional, sin planillas." },
            { icon: BarChart3, title: "Reportes claros", desc: "Las métricas de tu clínica en un panel simple." },
            { icon: Megaphone, title: "Marketing integrado", desc: "Campañas para atraer pacientes nuevos a tu agenda." },
          ].map((f) => (
            <StaggerItem key={f.title}>
              <div className="h-full rounded-3xl border border-border bg-card p-6 shadow-soft hover-lift">
                <div className="h-11 w-11 rounded-xl bg-brand/10 text-brand flex items-center justify-center mb-4"><f.icon className="h-[22px] w-[22px]" /></div>
                <h3 className="font-semibold text-foreground mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ===================== VERTICALES ===================== */}
      <section id="verticales" className="relative overflow-hidden bg-brand-panel text-white">
        <div className="aurora-bg opacity-40" />
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="relative mx-auto max-w-6xl px-5 py-20 md:py-24 text-center">
          <Reveal>
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">Un sistema para tu clínica, sea la que sea</h2>
            <p className="mt-4 text-white/70 text-lg max-w-2xl mx-auto">El mismo motor potente, adaptado a tu especialidad. Empezamos en estética y seguimos creciendo.</p>
          </Reveal>
          <Stagger className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {verticals.map((v) => (
              <StaggerItem key={v.label}>
                <div className="gradient-border rounded-2xl glass-panel p-6 flex flex-col items-center gap-3 hover:bg-white/10 transition-colors">
                  <div className="h-12 w-12 rounded-xl bg-white/10 text-brand-light flex items-center justify-center"><v.icon className="h-6 w-6" /></div>
                  <span className="font-medium">{v.label}</span>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ===================== CÓMO FUNCIONA ===================== */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:py-24">
        <Reveal className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-foreground tracking-tight">Empieza hoy, en 3 pasos</h2>
        </Reveal>
        <div className="relative grid md:grid-cols-3 gap-6">
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent" />
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1}>
              <div className="relative rounded-3xl border border-border bg-card p-8 shadow-soft text-center">
                <div className="mx-auto h-14 w-14 rounded-2xl bg-brand text-white font-display text-xl font-semibold flex items-center justify-center mb-5 glow-soft">{s.n}</div>
                <h3 className="font-semibold text-foreground text-lg mb-1.5">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===================== ROI ===================== */}
      <section className="bg-card border-y border-border/70">
        <div className="mx-auto max-w-5xl px-5 py-20 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <Reveal>
            <h2 className="font-display text-4xl md:text-5xl font-semibold text-foreground tracking-tight leading-[1.05]">Cuesta menos que una recepcionista, trabaja más</h2>
            <p className="mt-5 text-muted-foreground text-lg leading-relaxed">Por una fracción de lo que cuesta contratar, Medique agenda, recuerda las citas, ordena las fichas y atrae pacientes. Tú te dedicas a atender.</p>
            <Link href="/planes" className="mt-7 inline-flex h-12 items-center gap-2 px-7 rounded-2xl text-sm font-semibold bg-brand text-white hover:bg-brand-dark glow-soft transition-all">
              Ver planes y precios <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
          <Stagger className="space-y-3">
            {[
              "Tu propia página de reservas online incluida",
              "Recordatorios automáticos por WhatsApp",
              "Fidelización con puntos, incluida",
              "Copiloto con IA para el día a día",
              "Marketing y campañas para llenar tu agenda",
            ].map((t) => (
              <StaggerItem key={t}>
                <div className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4 hover-lift">
                  <div className="h-6 w-6 rounded-full bg-brand/10 flex items-center justify-center shrink-0 mt-0.5"><Check className="h-4 w-4 text-brand" /></div>
                  <span className="text-foreground font-medium">{t}</span>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ===================== PRICING PEEK ===================== */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:py-24">
        <Reveal className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-foreground tracking-tight">Precios simples y honestos</h2>
          <p className="mt-4 text-muted-foreground text-lg">Todo incluido. Paga anual y llévate 2 meses gratis.</p>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-6">
          {planPeek.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.08}>
              <div className={`relative rounded-3xl bg-card p-7 text-center ${p.featured ? "border-2 border-brand shadow-elevated md:-translate-y-2" : "border border-border shadow-soft"}`}>
                {p.featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand text-white text-xs font-semibold px-3 py-1 shadow-soft">Más popular</span>}
                <h3 className="font-display text-2xl font-semibold text-foreground">{p.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{p.who}</p>
                <div className="mt-4 font-display text-4xl font-semibold text-foreground">{p.price}<span className="text-base text-muted-foreground font-sans">/mes</span></div>
                <Link href="/planes" className={`mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors ${p.featured ? "bg-brand text-white hover:bg-brand-dark" : "border border-border text-foreground hover:bg-muted"}`}>Ver detalle</Link>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===================== FAQ ===================== */}
      <section className="bg-card border-y border-border/70">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-24">
          <Reveal className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-4xl md:text-5xl font-semibold text-foreground tracking-tight">Preguntas frecuentes</h2>
          </Reveal>
          <Reveal><Faq /></Reveal>
        </div>
      </section>

      {/* ===================== CTA FINAL ===================== */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-brand-panel text-white px-8 py-16 md:py-24 text-center">
            <div className="aurora-bg opacity-60" />
            <div className="absolute inset-0 bg-grid opacity-40" />
            <div className="relative">
              <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-tight max-w-3xl mx-auto leading-[1.05]">¿Listo para hacer crecer tu clínica?</h2>
              <p className="mt-5 text-white/75 text-lg max-w-xl mx-auto">Prueba Medique gratis por 14 días. Sin tarjeta, sin compromiso.</p>
              <Link href="/crear-cuenta" className="group mt-9 inline-flex h-13 items-center gap-2 px-9 py-4 rounded-2xl text-base font-semibold bg-brand text-white hover:bg-brand-dark glow-strong transition-all">
                Crear mi cuenta gratis <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  )
}
