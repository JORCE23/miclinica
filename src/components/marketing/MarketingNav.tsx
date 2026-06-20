"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Menu, X, ArrowRight } from "lucide-react"

const links = [
  { href: "/#funciones", label: "Funciones" },
  { href: "/#verticales", label: "Para tu clínica" },
  { href: "/planes", label: "Planes" },
]

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/80 backdrop-blur-xl border-b border-border/70 shadow-soft" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-medique-simbolo.png" alt="" className="h-8 w-8 object-contain transition-transform group-hover:scale-110" />
          <span className={`font-display text-2xl font-semibold tracking-tight transition-colors ${scrolled ? "text-brand-dark" : "text-white"}`}>Medique</span>
        </Link>

        <div className={`hidden md:flex items-center gap-8 text-sm font-medium ${scrolled ? "text-muted-foreground" : "text-white/80"}`}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="relative group/link py-1 transition-colors hover:text-brand">
              {l.label}
              <span className="absolute left-0 -bottom-0.5 h-0.5 w-0 bg-brand rounded-full transition-all duration-300 group-hover/link:w-full" />
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/login" className={`hidden sm:inline-flex h-9 items-center px-3 rounded-lg text-sm font-medium transition-colors ${scrolled ? "text-foreground hover:bg-muted" : "text-white/90 hover:bg-white/10"}`}>
            Iniciar sesión
          </Link>
          <Link href="/crear-cuenta" className="group hidden sm:inline-flex h-9 items-center gap-1.5 px-4 rounded-xl text-sm font-semibold bg-brand text-white hover:bg-brand-dark glow-soft transition-all">
            Prueba gratis <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <button onClick={() => setOpen(true)} className={`md:hidden h-9 w-9 inline-flex items-center justify-center rounded-lg ${scrolled ? "text-foreground hover:bg-muted" : "text-white hover:bg-white/10"}`} aria-label="Menú">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {/* Menú móvil */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] md:hidden"
          >
            <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className="absolute right-0 top-0 h-full w-72 bg-background shadow-elevated p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="font-display text-xl font-semibold text-brand-dark">Medique</span>
                <button onClick={() => setOpen(false)} className="h-9 w-9 inline-flex items-center justify-center rounded-lg hover:bg-muted"><X className="h-5 w-5" /></button>
              </div>
              <div className="flex flex-col gap-1">
                {links.map((l) => (
                  <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="px-3 py-3 rounded-lg text-foreground font-medium hover:bg-muted">{l.label}</Link>
                ))}
                <Link href="/login" onClick={() => setOpen(false)} className="px-3 py-3 rounded-lg text-foreground font-medium hover:bg-muted">Iniciar sesión</Link>
              </div>
              <Link href="/crear-cuenta" onClick={() => setOpen(false)} className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand text-white font-semibold hover:bg-brand-dark">
                Prueba gratis <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
