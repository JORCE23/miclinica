# Plan completo — Máquina de Ventas (SaaS self-service)
**Objetivo: pasar de "vender a pulso" (~340 clínicas/año techo) a "el sistema vende y onboardea solo" (~770+ clínicas/año).**

---

## 0) Punto de partida — lo que YA está hecho (la parte cara)

| Pieza | Estado | Dónde |
|---|---|---|
| **Multi-clínica (multi-tenant)** | ✅ Hecho | `clinic_id` en todo el modelo; tabla `clinics` con `slug` |
| **Registro self-service** (crea clínica + admin solo) | ✅ Hecho | `src/app/api/auth/signup/route.ts` |
| **Landing + reservas por clínica** | ✅ Hecho | `src/app/agenda/[slug]` |
| **Auth, roles, rate-limit, sanitización** | ✅ Hecho | `(auth)/login`, `auth-guard.ts` |
| Panel admin completo (agenda, fichas, caja, etc.) | ✅ Hecho | `src/app/admin/*` |

**Conclusión:** no construimos un SaaS desde cero. Le agregamos la **capa comercial** encima de una base que ya es multi-tenant y self-service. Por eso esto son semanas, no meses.

---

## 1) El embudo que vamos a construir (la máquina)

```
   VISITA              PRUEBA              PAGO              RETIENE           REFIERE
 (sitio público) → (registro 14 días) → (cobro auto) → (activación/soporte) → (referidos)
        ▲                  ▲                  ▲                 ▲                  ▲
     Módulo A         Módulo C/B          Módulo B          Módulo D/F         Módulo G
   marketing+SEO   onboarding+trial      pasarela CL       gating+nurture      programa ref.
```

Cada clínica que entra al embudo avanza **sin que tú la atiendas a mano**. Tú solo vigilas los números y atiendes a quien pide demo.

---

## 2) Los 7 módulos a construir

### MÓDULO A — Sitio público de marketing (la vitrina) 🔴 PRIORIDAD 1
**Qué es:** lo primero que ve un dueño de clínica. Hoy la raíz (`src/app/page.tsx`) redirige a `/login` → **no hay vitrina**.
**Construir:**
- Grupo de rutas `src/app/(marketing)/` con:
  - `/` Home: propuesta de valor, "todo incluido", capturas, testimonios, CTA "Prueba gratis 14 días".
  - `/planes` Página de precios (los 3 planes + add-ons del estudio).
  - `/estetica`, `/dental`, `/kine`, … Una landing **por vertical** (mismo producto, mensaje distinto) → clave para SEO y para los anuncios.
  - `/demo` Formulario para agendar demo (para los que no se auto-registran).
- SEO técnico: metadatos, sitemap, Open Graph, velocidad.
- Botón "Prueba gratis" en todas partes → lleva al registro existente.

**Esfuerzo:** M (1–2 semanas). Reutiliza tu sistema de diseño actual.

---

### MÓDULO B — Prueba gratis + cobro automático (billing) 🔴 PRIORIDAD 1
**Qué es:** el corazón del "vende dormido". Hoy **no hay cobro ni planes ni trial**.
**Construir:**
1. **Estado de suscripción** en la tabla `clinics` (o nueva tabla `subscriptions`):
   - `plan` (`esencial` | `profesional` | `clinica`), `status` (`trialing` | `active` | `past_due` | `canceled`), `trial_ends_at`, `current_period_end`, `vertical`.
2. **Trial de 14 días:** al registrarse, `status='trialing'`, `trial_ends_at = now()+14d`. Banner "Te quedan X días".
3. **Pasarela de pago chilena** (ver §4 para la recomendación):
   - Suscripción recurrente con tarjeta (cobro mensual/anual automático).
   - Webhook que actualiza `status` y `current_period_end`.
   - Página `/admin/settings/suscripcion`: ver plan, cambiar plan, método de pago, facturas.
4. **Paywall:** cuando el trial vence sin pago → bloquea el panel (deja ver/exportar, no operar) con pantalla "Activa tu plan".
5. **Descuento anual = 2 meses gratis** (del estudio).

**Esfuerzo:** L (2–3 semanas, la integración de pasarela + webhooks es lo más delicado).

---

### MÓDULO C — Onboarding self-service (que se configure solo) 🟠 PRIORIDAD 2
**Qué es:** hoy el registro crea la clínica pero la deja vacía → el dueño no sabe qué hacer. Si cada alta te cuesta horas, 70/mes es imposible.
**Construir:**
- **Asistente paso a paso** (post-registro, en `/admin`): 
  1. Datos de la clínica + logo. 2. Elige vertical (estética/dental/…). 3. Carga servicios (plantillas precargadas por vertical). 4. Horarios y profesionales. 5. Activa tu página de reservas `/agenda/[slug]`.
- **Barra de progreso** "Configura tu clínica (3/5)" en el dashboard.
- **Datos demo** opcionales para que vean el sistema "lleno" desde el minuto uno.

**Esfuerzo:** M (1–2 semanas).

---

### MÓDULO D — Captura y nurturing de leads (CRM-lite) 🟠 PRIORIDAD 2
**Qué es:** que ningún interesado se pierda y que las pruebas que no pagan reciban seguimiento **automático**.
**Construir:**
- Tabla `leads` (de formularios de demo y de trials): origen, vertical, estado.
- **Secuencias automáticas** (email + WhatsApp):
  - Día 0 trial: bienvenida + tutorial. Día 3: "¿necesitas ayuda?". Día 10: "te quedan 4 días + oferta anual". Día 14: "tu prueba venció".
  - Lead de demo sin registrarse: recordatorios.
- Panel interno `/admin/crm` (solo para ti y tu socio): ver leads, trials activos, quién está por vencer.
- Reusa la automatización/WhatsApp que ya existe en `/admin/automations` y `/admin/marketing`.

**Esfuerzo:** M (1–2 semanas).

---

### MÓDULO E — Límites y features por plan (gating) 🟠 PRIORIDAD 2
**Qué es:** que cada plan valga lo que cuesta y empuje al upgrade.
**Construir:**
- Helper central `can(feature, plan)` / `limits(plan)`.
- Límites por plan: nº de profesionales, nº de reservas/mes, módulos (IA, análisis facial, marketing automation, multi-sucursal).
- UI: candaditos "Disponible en plan Pro" con CTA de upgrade.

**Esfuerzo:** S–M (3–5 días).

---

### MÓDULO F — Módulos por vertical (abrir mercados) 🟢 PRIORIDAD 3
**Qué es:** lo que multiplica el TAM ×20. El core es el mismo; cambia la ficha especializada.
**Construir:**
- Campo `vertical` en `clinics` ya definido en Módulo B.
- **Dental (vertical #2, el más grande):** odontograma, ficha de piezas, presupuestos por tratamiento. Compite con Dentalink.
- Estética ya está (Ricketts/punción). Kine/psico/nutri: el core actual **ya les sirve**, solo plantillas de servicios.
- Render condicional de la ficha según `vertical`.

**Esfuerzo:** Dental M–L (2–3 semanas); las demás S (plantillas).

---

### MÓDULO G — Analítica de embudo + referidos 🟢 PRIORIDAD 3
**Qué es:** medir para mejorar, y que tus clientes te traigan clientes (canal más barato).
**Construir:**
- Tracking del funnel: visita → registro → activación → pago (Google Analytics/Plausible + eventos propios).
- Tablero interno: conversión trial→pago, altas/mes, churn, MRR.
- **Programa de referidos:** "trae una clínica y ambos reciben 1 mes gratis" (tabla `referrals` + código por clínica).

**Esfuerzo:** M (1 semana analítica + 1 semana referidos).

---

## 3) Cambios en el modelo de datos (resumen)

```sql
-- En clinics (o tabla subscriptions aparte):
ALTER TABLE clinics ADD COLUMN plan text DEFAULT 'esencial';
ALTER TABLE clinics ADD COLUMN status text DEFAULT 'trialing';      -- trialing|active|past_due|canceled
ALTER TABLE clinics ADD COLUMN trial_ends_at timestamptz;
ALTER TABLE clinics ADD COLUMN current_period_end timestamptz;
ALTER TABLE clinics ADD COLUMN vertical text DEFAULT 'estetica';    -- estetica|dental|kine|psico|...
ALTER TABLE clinics ADD COLUMN billing_customer_id text;            -- id en la pasarela

CREATE TABLE leads (id, email, phone, clinic_name, vertical, source, status, created_at);
CREATE TABLE referrals (id, referrer_clinic_id, referred_clinic_id, code, reward_status, created_at);
CREATE TABLE billing_events (id, clinic_id, type, raw jsonb, created_at);  -- auditoría de webhooks
```

---

## 4) Decisión técnica: ¿qué pasarela de pago? (recomendación)

| Opción | Suscripción recurrente | Notas |
|---|---|---|
| **Flow.cl** ✅ recomendado | Sí (cobros recurrentes nativos) | El estándar para SaaS chileno; tarjetas + débito; integración simple por API/webhooks |
| **Mercado Pago** (alt.) | Sí (preapproval/suscripciones) | Buena cobertura, muchos ya tienen cuenta; comisiones competitivas |
| Transbank Webpay Oneclick | Sí (tarjeta on-file) | Más "oficial" pero integración más pesada |
| Stripe | Limitado en Chile | Mejor si algún día cobras en USD/regional |

**Recomendación:** arrancar con **Flow.cl** (recurrente nativo, rápido de integrar). Es una **decisión que conviene confirmar contigo** antes de codear el Módulo B.

---

## 5) Roadmap por fases

### 🟢 FASE 1 — "Máquina mínima viable" (≈3–4 semanas) → ya puedes vender solo
1. Módulo A: Home + /planes + 1 landing vertical (estética).
2. Módulo B: planes + trial 14 días + Flow + paywall.
3. Módulo C: onboarding wizard básico.
**Resultado:** una clínica puede **descubrir → probar → pagar → usar**, sin que toques nada.

### 🟠 FASE 2 — "Que no se pierda nadie" (≈2–3 semanas)
4. Módulo D: leads + secuencias automáticas + panel CRM.
5. Módulo E: gating por plan.
6. Módulo A+: landings por vertical + SEO.

### 🟢 FASE 3 — "Multiplicar mercado y crecer" (≈3–4 semanas)
7. Módulo F: vertical dental (odontograma + presupuestos).
8. Módulo G: analítica de embudo + referidos.

**Total a máquina completa: ~8–11 semanas** (más rápido con foco y trabajo asistido).

---

## 6) Métricas que vas a vigilar (el tablero del dueño)

- **Altas de trial / mes** (tope del embudo).
- **Conversión trial → pago** (meta sana SaaS: 15–25% self-service).
- **MRR y MRR neto** (crecimiento mes a mes).
- **Churn mensual** (meta < 4%).
- **CAC** (cuánto cuesta traer una clínica vía ads) vs **LTV**.
- **Activación** (% que completa el onboarding y agenda su 1ª cita).

---

## 7) Riesgos y cómo los manejamos

- **Integración de pago (lo más delicado):** empezar con Flow, probar a fondo el flujo trial→cobro→webhook en sandbox antes de producción.
- **Trials que no activan:** lo ataca el onboarding (C) + nurturing (D).
- **Soporte no escala:** centro de ayuda + datos demo + tutoriales en el onboarding.
- **No diluir foco:** lanzar **estética primero**, dental como #2; no abrir 5 verticales a la vez.

---

## 8) Recomendación: por dónde empezamos

**Fase 1, en este orden:**
1. **Sitio público + /planes** (Módulo A) — para tener qué mostrar en los anuncios.
2. **Trial + cobro con Flow** (Módulo B) — para que el "sí" se convierta en plata solo.
3. **Onboarding wizard** (Módulo C) — para que activen sin ti.

Con esas 3, ya tienes la **máquina mínima** funcionando y puedes meterle anuncios y escalar. Lo demás (CRM, dental, referidos) se suma sobre una máquina que ya gira.

> **Decisión que necesito de ti para arrancar el Módulo B:** ¿vamos con **Flow.cl** para los cobros, o prefieres Mercado Pago / otra?
