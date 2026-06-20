import Link from "next/link"
import {
  CalendarCheck, Users, Globe, Sparkles, Wallet, Gift, BarChart3, Bot,
  Stethoscope, Scissors, Brain, Apple, PawPrint, Smile, Check, ArrowRight,
} from "lucide-react"

export const metadata = {
  title: "Software + Marketing para tu clínica",
  description: "Agenda, pacientes, reservas online propias, fidelización y marketing en un solo sistema. Prueba gratis 14 días.",
}

const features = [
  { icon: CalendarCheck, title: "Agenda y reservas 24/7", desc: "Tus pacientes reservan solos, online, a cualquier hora. Menos llamadas, menos inasistencias." },
  { icon: Globe, title: "Tu página de reservas propia", desc: "Cada clínica recibe su propia web de reservas lista para compartir. Sin pagar otra herramienta." },
  { icon: Users, title: "Ficha de pacientes completa", desc: "Historial, fotos antes/después, consentimientos y evolución, todo ordenado y a un clic." },
  { icon: Bot, title: "Copiloto con IA", desc: "Un asistente que responde, agenda y te ayuda con las tareas del día. Como una recepcionista que no descansa." },
  { icon: Wallet, title: "Caja y control de ingresos", desc: "Sabe cuánto entra cada día, por servicio y por profesional, sin planillas." },
  { icon: Gift, title: "Fidelización Glow Points", desc: "Premia a tus pacientes con puntos y haz que vuelvan. Incluido, no es un extra." },
  { icon: BarChart3, title: "Reportes claros", desc: "Métricas de tu clínica en un panel simple, para decidir con datos." },
  { icon: Sparkles, title: "Análisis facial estético", desc: "Plano de Ricketts y proporción áurea sobre la foto del paciente. Diferénciate en la consulta." },
]

const verticals = [
  { icon: Sparkles, label: "Estética" },
  { icon: Smile, label: "Dental" },
  { icon: Stethoscope, label: "Médica" },
  { icon: Brain, label: "Psicología" },
  { icon: Apple, label: "Nutrición" },
  { icon: Scissors, label: "Belleza" },
  { icon: PawPrint, label: "Veterinaria" },
  { icon: Users, label: "Kinesiología" },
]

const steps = [
  { n: "1", title: "Crea tu cuenta gratis", desc: "En 2 minutos tienes tu clínica lista. Sin tarjeta, sin instalaciones." },
  { n: "2", title: "Configura tu clínica", desc: "Un asistente te guía: servicios, horarios y tu página de reservas." },
  { n: "3", title: "Empieza a recibir reservas", desc: "Comparte tu link, llena tu agenda y crece con marketing integrado." },
]

export default function MarketingHome() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-brand-panel text-white">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-brand/25 blur-3xl animate-float" />
        <div className="absolute right-0 top-10 h-64 w-64 rounded-full bg-brand-light/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-5 py-20 md:py-28 text-center">
          <span className="inline-flex items-center gap-2 rounded-full glass-panel px-4 py-1.5 text-xs font-medium text-brand-light mb-6">
            <Sparkles className="h-3.5 w-3.5" /> Software + Marketing para tu clínica
          </span>
          <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05] max-w-3xl mx-auto">
            Todo lo que tu clínica necesita, en un solo lugar
          </h1>
          <p className="mt-6 text-lg md:text-xl text-white/75 max-w-2xl mx-auto leading-relaxed">
            Agenda, pacientes, tu propia página de reservas, fidelización y marketing.
            Sin armar el rompecabezas con cinco herramientas distintas.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/crear-cuenta" className="inline-flex h-12 items-center gap-2 px-7 rounded-xl text-base font-semibold bg-brand text-white hover:bg-brand-dark shadow-glow transition-all">
              Prueba gratis 14 días <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/planes" className="inline-flex h-12 items-center px-7 rounded-xl text-base font-semibold glass-panel text-white hover:bg-white/15 transition-all">
              Ver planes
            </Link>
          </div>
          <p className="mt-5 text-sm text-white/55">Sin tarjeta de crédito · Configúrala en minutos · Cancela cuando quieras</p>
        </div>
      </section>

      {/* FUNCIONES */}
      <section id="funciones" className="mx-auto max-w-6xl px-5 py-20 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground tracking-tight">Todo incluido, sin sorpresas</h2>
          <p className="mt-4 text-muted-foreground text-lg">Otros te cobran aparte el WhatsApp, la web y la fidelización. Aquí viene todo en el mismo plan.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6 shadow-soft hover-lift">
              <div className="h-11 w-11 rounded-xl bg-brand/10 text-brand flex items-center justify-center mb-4">
                <f.icon className="h-[22px] w-[22px]" />
              </div>
              <h3 className="font-semibold text-foreground mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* VERTICALES */}
      <section id="verticales" className="bg-card border-y border-border/70">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-24 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground tracking-tight">Un sistema para tu clínica, sea la que sea</h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">El mismo motor potente, adaptado a tu especialidad. Empezamos en estética y seguimos creciendo.</p>
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {verticals.map((v) => (
              <div key={v.label} className="rounded-2xl border border-border bg-background p-6 flex flex-col items-center gap-3 hover-lift">
                <div className="h-12 w-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                  <v.icon className="h-6 w-6" />
                </div>
                <span className="font-medium text-foreground">{v.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground tracking-tight">Empieza hoy, en 3 pasos</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.n} className="relative rounded-2xl border border-border bg-card p-7 shadow-soft">
              <div className="h-10 w-10 rounded-full bg-brand text-white font-display text-lg font-semibold flex items-center justify-center mb-4">{s.n}</div>
              <h3 className="font-semibold text-foreground text-lg mb-1.5">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DIFERENCIADOR / ROI */}
      <section className="bg-card border-y border-border/70">
        <div className="mx-auto max-w-5xl px-5 py-20 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground tracking-tight">Cuesta menos que una recepcionista, trabaja más</h2>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
              Por una fracción de lo que cuesta contratar, Medique agenda, recuerda las citas, ordena las fichas y atrae pacientes con marketing. Tú te dedicas a atender.
            </p>
            <Link href="/planes" className="mt-7 inline-flex h-11 items-center gap-2 px-6 rounded-xl text-sm font-semibold bg-brand text-white hover:bg-brand-dark shadow-soft transition-colors">
              Ver planes y precios <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="space-y-3">
            {[
              "Tu propia página de reservas online incluida",
              "Recordatorios automáticos por WhatsApp",
              "Programa de fidelización con puntos incluido",
              "Copiloto con IA para el día a día",
              "Marketing y campañas para llenar tu agenda",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 rounded-xl border border-border bg-background p-4">
                <Check className="h-5 w-5 text-brand shrink-0 mt-0.5" />
                <span className="text-foreground font-medium">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:py-24">
        <div className="relative overflow-hidden rounded-3xl bg-brand-panel text-white px-8 py-16 md:py-20 text-center">
          <div className="absolute inset-0 bg-grid opacity-60" />
          <div className="absolute -right-20 -top-10 h-72 w-72 rounded-full bg-brand/25 blur-3xl animate-float" />
          <div className="relative">
            <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight max-w-2xl mx-auto">¿Listo para hacer crecer tu clínica?</h2>
            <p className="mt-4 text-white/75 text-lg max-w-xl mx-auto">Prueba Medique gratis por 14 días. Sin tarjeta, sin compromiso.</p>
            <Link href="/crear-cuenta" className="mt-8 inline-flex h-12 items-center gap-2 px-8 rounded-xl text-base font-semibold bg-brand text-white hover:bg-brand-dark shadow-glow transition-all">
              Crear mi cuenta gratis <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
