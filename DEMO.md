# 🎬 Guía de Demo — Medique

Cómo mostrarle el sistema funcionando a un cliente potencial, con datos realistas.

## 1. Preparar la demo (1 clic)

Antes de cada reunión, **genera (o resetea) la Clínica Demo** con datos frescos.

**Requisitos previos (una sola vez):**
- Tener aplicadas todas las migraciones: `supabase db push`.
- Tener la variable `DEMO_SECRET` configurada en Vercel (cualquier texto secreto). Si no, se usa `CRON_SECRET`.

**Generar / resetear** (reemplaza `TU_SECRETO` y el dominio):

```bash
curl -X POST "https://miclinica-theta.vercel.app/api/admin/create-demo-clinic?secret=TU_SECRETO"
```

Responde con un resumen y los enlaces. Puedes ejecutarlo **las veces que quieras**: borra la demo anterior y la vuelve a crear limpia (no duplica).

## 2. Credenciales y enlaces

| Qué | Valor |
|---|---|
| **Login admin** | `demo@miclinica.cl` |
| **Contraseña** | `DemoMedique2026` |
| **Reserva online (pacientes)** | `https://TU-DOMINIO/agenda/clinica-demo` |
| **Formulario de colaboración** | `https://TU-DOMINIO/colaborar/clinica-demo` |

Puedes **compartir pantalla** mientras navegas, o **pasarle el login** al cliente para que lo explore él mismo.

## 3. Qué incluye la demo (datos de ejemplo)

- 1 clínica con horarios configurados (Lun–Vie 09–19, Sáb 10–14).
- 4 profesionales · 12 servicios (faciales y corporales con precios).
- 12 pacientes con ficha (algunos con alergias/antecedentes).
- ~25 citas repartidas (pasadas completadas, esta semana, próximas).
- Inventario (15 insumos con stock/costo, uno bajo mínimo).
- Caja de la semana (ingresos por método + egresos).
- Fidelidad (puntos por paciente), 5 campañas de marketing, 8 pendientes,
  5 colaboraciones recibidas y conversaciones de WhatsApp.

## 4. Guion sugerido (8–10 min)

1. **Dashboard** — "Acá ves el resumen del día: ingresos, citas, pacientes."
2. **Agenda** — muestra la semana con citas de distinta duración y estados.
3. **Pacientes** — abre una ficha: datos, alergias, antecedentes, historial.
4. **Reserva online en vivo** 📱 — abre `/agenda/clinica-demo` en el celular y
   **agenda una cita delante del cliente**; vuelve al panel y muéstrala aparecer.
5. **Caja e Inventario** — bruto vs neto, stock bajo mínimo, descuento de insumos.
6. **Fidelidad y Marketing** — puntos, campañas con ROI por canal.
7. **Pendientes y Colaboraciones** — tareas del equipo + postulaciones recibidas.
8. **Cierre** — "Todo esto queda con TU marca y TUS datos. ¿Lo activamos?"

## 5. Para que un cliente cree SU cuenta

Después de la demo, el cliente puede registrarse solo en:

```
https://TU-DOMINIO/crear-cuenta
```

Crea su clínica + su usuario admin y entra directo al panel (vacío, listo para
cargar sus datos). Opcionalmente puede usar "cargar servicios de ejemplo".

> 💡 Si quieres mostrar el **bot de WhatsApp respondiendo en vivo**, configura
> `GROQ_API_KEY` y las llaves `ULTRAMSG_*`. El historial de la demo se ve igual
> sin esas llaves.
