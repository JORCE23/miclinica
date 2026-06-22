# 📘 LIBRO MAESTRO — Medique
### La biblia del producto: qué es, qué hace y cómo será todo
*Documento vivo · Versión 1.0 · Junio 2026*

> **Leyenda:** ✅ Construido y funcionando · 🟡 Parcial / en afinación · 🔜 Planificado (por construir)

---

## 1. Visión y propósito

**Medique es el sistema operativo de una clínica.** Un solo lugar donde el dueño y su equipo gestionan pacientes, agenda, dinero, marketing y crecimiento — sin armar un rompecabezas con cinco herramientas distintas.

- **Promesa al cliente:** *"Tu clínica, impecable y llena."* Software + Marketing en un mismo producto.
- **Para quién:** clínicas y profesionales de salud y belleza — empieza en **estética**, y el mismo motor sirve a **dental, médica, kinesiología, psicología, nutrición, veterinaria y belleza**.
- **Diferencia central:** la competencia cobra aparte el WhatsApp, la web de reservas y la fidelización. **Medique los incluye** y además ofrece **marketing gestionado** para llenar la agenda.
- **Modelo de negocio:** suscripción mensual (SaaS) + servicios de marketing como add-ons.

---

## 2. Identidad de marca

| Elemento | Definición |
|---|---|
| **Nombre** | Medique |
| **Color de marca** | Azul `#2E7FB0` (brand), navy `#162439` (paneles), acentos claros `#5BA3CE` |
| **Tipografías** | Cormorant Garamond (títulos, serif elegante) · Jost (texto, sans limpia) |
| **Tono** | Profesional, cálido, confiable. Premium pero cercano. Español de Chile. |
| **Estilo visual** | Minimalista, mucho aire, un solo color de marca, color semántico solo donde informa (alertas, ingresos, estados) |

---

## 3. Arquitectura general ✅

- **Framework:** Next.js 14 (App Router) + React 18 + TypeScript.
- **Base de datos y auth:** Supabase (PostgreSQL + autenticación).
- **Estilos:** Tailwind CSS + sistema de diseño propio + componentes base-ui.
- **Animaciones:** framer-motion.
- **Multi-clínica (multi-tenant) ✅:** cada clínica vive aislada con su `clinic_id`. Los datos de una clínica nunca se cruzan con otra.
- **Seguridad ✅:** roles, guard de rutas, rate-limiting anti-spam, sanitización de entradas, registro de auditoría.
- **100% en la nube:** sin instalaciones; se usa desde el navegador, celular o tablet.

---

## 4. Los cuatro mundos de Medique

Medique no es una sola pantalla: son cuatro espacios conectados.

| Mundo | Quién lo usa | Ruta | Estado |
|---|---|---|---|
| **1. Sitio público** (marketing) | Visitantes / dueños evaluando | `/`, `/planes`, `/estetica` | ✅ |
| **2. Panel de la clínica** | El dueño y su equipo | `/admin` | ✅ |
| **3. Reservas y portal del paciente** | Los pacientes finales | `/agenda/[clínica]`, `/client`, `/consent-sign` | ✅ |
| **4. Panel de Dueño (plataforma)** | Tú y tu socio (dueños de Medique) | `/owner` | 🔜 |

---

## 5. Mundo 1 — Sitio público (marketing) ✅

La vitrina que convierte visitantes en clientes.

- **Home (`/`):** hero con mockup animado del producto, funciones, verticales, cómo funciona, ROI, vista previa de planes y FAQ. Efectos premium (aurora, parallax, reveal al scroll, contadores).
- **Planes (`/planes`):** los 3 planes + add-ons de marketing.
- **Landing por vertical (`/estetica`):** mensaje específico por especialidad. 🔜 Faltan `/dental`, `/kinesiologia`, etc.
- **CTAs** → llevan al registro self-service (`/crear-cuenta`).

---

## 6. Mundo 2 — Panel de la clínica (`/admin`) ✅

El corazón operativo. **18 secciones**, cada una un módulo:

| # | Sección | Qué hace | Estado |
|---|---|---|---|
| 1 | **Dashboard** | Resumen del día: KPIs, citas, ingresos, accesos rápidos | ✅ |
| 2 | **Mi Panel** | Vista personalizada / widgets del profesional | ✅ |
| 3 | **Pacientes** | Fichas completas (ver §7) | ✅ |
| 4 | **Reservas** | Calendario de citas, agenda visual, crear/editar | ✅ |
| 5 | **Pendientes** | Tareas y cosas por resolver | ✅ |
| 6 | **Sala de espera** | Quién está esperando, flujo de atención del día | ✅ |
| 7 | **Caja** | Ingresos, egresos, cierre de caja, métodos de pago | ✅ |
| 8 | **Servicios** | Catálogo de tratamientos, precios, duración | ✅ |
| 9 | **Inventario** | Stock, productos, alertas de stock bajo y por vencer | ✅ |
| 10 | **Equipo** | Profesionales, horarios, datos | ✅ |
| 11 | **Fidelidad** | Programa de puntos Glow Points (ver §9) | ✅ |
| 12 | **Marketing** | Campañas, origen de pacientes, comunicación | ✅ |
| 13 | **Automatizaciones** | Recordatorios y acciones automáticas | ✅ |
| 14 | **Agente IA** | Copiloto inteligente de la clínica (ver §8) | ✅ |
| 15 | **Reportes** | Métricas e informes del negocio | ✅ |
| 16 | **Colaboraciones** | Trabajo con colaboradores/referidos externos | ✅ |
| 17 | **Administración** | Usuarios, roles, datos de la clínica, auditoría | ✅ |
| 18 | **Configuración** | Ajustes generales, preferencias, marca | ✅ |

---

## 7. La ficha del paciente — el activo más valioso ✅

Cada paciente tiene una ficha con pestañas:

| Pestaña | Contenido | Estado |
|---|---|---|
| **Personal** | Datos de contacto, identificación | ✅ |
| **Historia médica** | Antecedentes de salud | ✅ |
| **Alergias** | Alergias con severidad (leve/moderada/severa) | ✅ |
| **Procedimientos estéticos** | Historial de tratamientos (botox, ácido hialurónico…) | ✅ |
| **Ficha clínica** | Registro clínico de la atención | ✅ |
| **Consentimientos** | Consentimientos informados, firma digital, envío por WhatsApp | ✅ |
| **Citas** | Historial de citas del paciente | ✅ |
| **Fidelidad** | Puntos y movimientos del paciente | ✅ |
| **Análisis facial** | Plano de Ricketts + proporción áurea sobre foto, diagrama facial, vista 3D y giro 360° | ✅ / 🟡 |
| **Punción / mapa muscular** | Mapa de músculos con puntos, dosis (ej. 10U) y total (ej. 170U) | 🔜 |
| **Simulación** | Comparador antes/después con plan de tratamiento | ✅ |
| **Resumen IA** | Resumen clínico generado por inteligencia artificial | ✅ |

---

## 8. Inteligencia Artificial ✅

Medique tiene IA integrada de verdad, no de adorno:

- **Copiloto / Agente IA ✅:** asistente que entiende la clínica y ayuda con tareas (agendar, consultar caja, responder). Vive en la sección "Agente IA".
- **Resumen clínico IA ✅:** genera un resumen del paciente a partir de lo registrado.
- **Transcripción ✅:** dicta y convierte voz a texto (API de transcripción).
- 🔜 **Recepcionista IA** que conteste y agende automáticamente (futuro add-on premium).

---

## 9. Reservas y portal del paciente ✅

- **Página de reservas por clínica (`/agenda/[clínica]`) ✅:** cada clínica recibe su propia URL pública donde sus pacientes reservan online 24/7, sin instalar nada ni registrarse.
- **Portal del cliente (`/client`) ✅:** espacio para el paciente.
- **Firma de consentimientos (`/consent-sign/[token]`) ✅:** el paciente firma desde su celular.
- **Recordatorios automáticos ✅:** por WhatsApp / correo, con tarea diaria (cron) que recuerda las citas de mañana.

---

## 10. Fidelización — Glow Points ✅

- Programa de puntos: los pacientes **ganan, canjean** y se ajustan puntos.
- Tipos de movimiento: ganados, canjeados, ajuste, expirados.
- Objetivo: que los pacientes **vuelvan** por sus mantenciones. Incluido en todos los planes (la competencia lo cobra aparte).

---

## 11. Marketing y crecimiento

- **Dentro de la app ✅:** campañas, origen/campaña de cada paciente, comunicación.
- **Servicios gestionados (add-ons) 🔜/servicio:** Meta Ads, gestión de Instagram, auditoría 1-a-1 con calendario de contenido. *(Son servicio humano, se venden aparte.)*

---

## 12. Multi-vertical — el mismo motor para toda clínica 🔜

La clave del crecimiento: **el núcleo es el mismo; solo cambia la ficha especializada.**

| Vertical | Qué se reutiliza | Qué se agrega | Estado |
|---|---|---|---|
| **Estética** | Todo el core | Análisis facial, punción, antes/después | ✅ |
| **Dental** | Todo el core | Odontograma, fichas de piezas, presupuestos | 🔜 (vertical #2) |
| **Kine / Psico / Nutri / Fono** | Todo el core | Solo plantillas de servicios | 🔜 (casi listo con el core actual) |
| **Veterinaria** | Todo el core | Ficha de mascota/dueño | 🔜 |

Mercado total en Chile: **~150.000–250.000 negocios** con agenda. (Ver estudio de mercado.)

---

## 13. La capa comercial — la "máquina de ventas" 🔜

Lo que convierte la app en un negocio que escala solo. (Ver `PLAN_MAQUINA_DE_VENTAS.md`.)

| Módulo | Qué hace | Estado |
|---|---|---|
| **A. Sitio público** | Vitrina que atrae y convierte | ✅ |
| **B. Cobro + prueba gratis** | Trial 14 días, pasarela chilena, paywall, planes | 🔜 |
| **C. Onboarding self-service** | Que la clínica se configure sola tras registrarse | 🔜 |
| **D. Leads + nurturing** | Captura de interesados + seguimiento automático | 🔜 |
| **E. Límites por plan** | Gating de funciones según el plan contratado | 🔜 |
| **F. Módulos por vertical** | Dental y otras especialidades | 🔜 |
| **G. Panel de Dueño + analítica** | MRR, ventas, churn, leads — tu "orden" | 🔜 |

**El registro self-service ✅ y la multi-tenencia ✅ ya existen** — la base más difícil está hecha.

---

## 14. Planes y precios (resumen)

| Plan | Precio/mes | Para |
|---|---|---|
| **Esencial** | $34.900 | Solo / 1–3 profesionales |
| **Profesional** ⭐ | $59.900 | Clínica de 3–6 profesionales |
| **Clínica** | $99.000 | Mediana, 4–15 profesionales |

**Todo incluido** (reservas, fidelización, recordatorios, IA básica). Anual = 2 meses gratis.
**Add-ons:** Meta Ads $290.000 · Auditoría 1-a-1 $180.000 · Instagram $290.000 · Landing premium $19.000.

---

## 15. Estado actual y hoja de ruta

### ✅ Lo que YA funciona
- Panel completo de la clínica (18 módulos), fichas de pacientes, reservas públicas, caja, inventario, fidelización, IA (copiloto, resumen, transcripción), análisis facial, consentimientos digitales, multi-tenencia, registro self-service y **sitio público premium**.

### 🔜 Lo que viene (en orden sugerido)
1. **Cobro + trial (Módulo B)** — para empezar a facturar.
2. **Onboarding self-service (Módulo C)** — que activen sin ti.
3. **Panel de Dueño (Módulo G)** — tu orden: MRR, ventas, pruebas.
4. **Módulo dental (Módulo F)** — abrir la vertical #2.
5. **Punción / mapa muscular** — completar la ficha estética.
6. **Más landings por vertical + nurturing** — combustible para los anuncios.

---

## 16. Glosario

| Término | Significado |
|---|---|
| **Multi-tenant** | Una sola app que aloja muchas clínicas, cada una aislada |
| **Self-service** | El cliente se registra y configura solo, sin que tú intervengas |
| **Trial** | Período de prueba gratis (14 días) |
| **MRR** | Ingreso recurrente mensual (la suma de todas las suscripciones) |
| **Churn** | Clientes que se dan de baja |
| **Glow Points** | El programa de fidelización por puntos de Medique |
| **Vertical** | Un tipo de clínica (estética, dental, etc.) |
| **Add-on** | Servicio extra que se contrata aparte del plan base |
| **Panel de Dueño** | Tu panel privado para ver todas las clínicas y la facturación |

---

*Medique — el sistema para tu clínica, sea la que sea.*
