"use client"

import { motion } from "framer-motion"
import { CalendarCheck, TrendingUp, Gift, Users, Bell } from "lucide-react"

/* Mockup estilizado del panel — da sensación de producto real sin necesitar screenshot */
export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md md:max-w-lg" style={{ perspective: "1200px" }}>
      <motion.div
        initial={{ opacity: 0, y: 40, rotateX: 12 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        className="relative"
      >
        {/* Ventana del panel */}
        <div className="animate-float-tilt rounded-2xl bg-white shadow-[0_30px_80px_-20px_rgba(15,26,42,0.6)] border border-white/40 overflow-hidden">
          {/* Barra superior */}
          <div className="flex items-center gap-1.5 px-4 h-9 bg-slate-50 border-b border-slate-100">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="ml-3 text-[10px] text-slate-400 font-medium">medique.app/admin</span>
          </div>
          <div className="flex">
            {/* Sidebar mini */}
            <div className="hidden sm:flex flex-col gap-2 w-14 bg-[#162439] py-4 items-center">
              <div className="h-7 w-7 rounded-lg bg-brand/90" />
              {[Users, CalendarCheck, Gift, TrendingUp].map((I, i) => (
                <div key={i} className={`h-7 w-7 rounded-lg flex items-center justify-center ${i === 1 ? "bg-white/15" : ""}`}>
                  <I className="h-3.5 w-3.5 text-white/70" />
                </div>
              ))}
            </div>
            {/* Contenido */}
            <div className="flex-1 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-2 w-20 rounded bg-slate-200" />
                  <div className="mt-1.5 h-3 w-28 rounded bg-slate-800/80" />
                </div>
                <div className="h-7 w-7 rounded-full bg-brand/20" />
              </div>
              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { c: "bg-brand/10", t: "bg-brand/30", v: "bg-brand/70" },
                  { c: "bg-emerald-50", t: "bg-emerald-200", v: "bg-emerald-500/70" },
                  { c: "bg-amber-50", t: "bg-amber-200", v: "bg-amber-500/70" },
                ].map((s, i) => (
                  <div key={i} className={`rounded-lg ${s.c} p-2`}>
                    <div className={`h-1.5 w-8 rounded ${s.t}`} />
                    <div className={`mt-2 h-2.5 w-10 rounded ${s.v}`} />
                  </div>
                ))}
              </div>
              {/* Agenda */}
              <div className="rounded-lg border border-slate-100 p-2.5 space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`h-6 w-1 rounded-full ${i === 0 ? "bg-brand" : i === 1 ? "bg-emerald-400" : "bg-violet-400"}`} />
                    <div className="flex-1">
                      <div className="h-2 w-24 rounded bg-slate-200" />
                      <div className="mt-1 h-1.5 w-16 rounded bg-slate-100" />
                    </div>
                    <div className="h-2 w-8 rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tarjetas flotantes */}
        <motion.div
          initial={{ opacity: 0, x: -30, y: 10 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="absolute -left-6 sm:-left-12 top-20 rounded-xl bg-white shadow-elevated border border-slate-100 px-3 py-2.5 flex items-center gap-2.5"
        >
          <div className="h-8 w-8 rounded-lg bg-brand/10 flex items-center justify-center">
            <Bell className="h-4 w-4 text-brand" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-800 leading-tight">Nueva reserva</p>
            <p className="text-[10px] text-slate-400">Camila · 16:30</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30, y: -10 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="absolute -right-4 sm:-right-10 bottom-16 rounded-xl bg-white shadow-elevated border border-slate-100 px-3 py-2.5 flex items-center gap-2.5"
        >
          <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Gift className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-800 leading-tight">+50 Glow Points</p>
            <p className="text-[10px] text-slate-400">Fidelización</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Glow detrás */}
      <div className="absolute inset-0 -z-10 blur-3xl bg-brand/30 rounded-full scale-90 translate-y-6" />
    </div>
  )
}
