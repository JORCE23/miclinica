# 🗺️ Mapa de Ventanas — Medique vs Prototipo JC Medical

> **Para qué sirve este archivo:** comparar **ventana por ventana** (pantalla, modal, pestaña) el prototipo de JC contra tu app actual, para detectar las diferencias reales — incluso esas que "parecen iguales pero son distintas". La comparación es a nivel de *campos y botones*, no de aspecto visual.
>
> **Cómo leerlo:**
> - ✅ **Ya está** — existe en tu app con paridad (o mejor).
> - 🟡 **Parcial** — existe pero le falta algo concreto del prototipo (se indica qué).
> - ❌ **Falta** — no existe aún en tu app.
>
> **Método:** se leyó el código real del prototipo (`jc-admin.jsx`, `-b`, `-c`, `jc-copilot`, `jc-face`, `jc-jcm`, `jc-mobile`, `PANEL_ADMIN_CONTEXTO.md`) y el código real de tu app (`src/app/admin/**`, `src/components/admin/**`). Última actualización: 2026-06-24.

---

## Resumen ejecutivo

Tu app ya cubre **la gran mayoría** del prototipo (dashboard, agenda, ficha clínica completa, inventario con lotes/vencimiento, caja bruto/neto, sala de espera Kanban, pendientes, administración, configuración con editor de horarios, agente IA, automatizaciones, colaboraciones, reportes, fidelidad, marketing). Eso es porque tu proyecto es un sistema real con backend, no un prototipo.

Lo que **falta o está distinto** son piezas puntuales (la mayoría son *ventanas/modales* específicos, no secciones enteras). Están listadas y priorizadas al final.

---

## Comparación por área

### 1. Dashboard / Resumen
| Ventana del prototipo | Estado | Detalle |
|---|---|---|
| Dashboard con KPIs clickeables | ✅ Ya está | `DashboardStats.tsx` — KPIs, gráfico evolución, próximas citas, tabs |
| Popup de detalle al clickear KPI (lista de pacientes/citas/ingresos) | 🟡 Parcial | Los KPIs son clickeables pero abren filtro/sección, no un popup con la lista detallada |
| Feed de notificaciones (consentimientos, re-citas, WhatsApp, Meta Ads) | 🟡 Parcial | Hay tab "Notificaciones"; faltan los tipos Meta Ads / comentarios de redes |

### 2. Agenda / Citas
| Ventana del prototipo | Estado | Detalle |
|---|---|---|
| Vista Lista + Vista Calendario semanal | ✅ Ya está | `WeekAgendaGrid` + `AppointmentList` |
| Bloques proporcionales a la duración | ✅ Ya está | |
| **Modal "Nueva Cita" tipo asistente 3 pasos con GRILLA visual de horarios** | ❌ **Falta** | El prototipo elige el horario clickeando un bloque de 30 min en una grilla semanal. Tu "Nueva Cita" usa selects de fecha/hora |
| **Menú contextual (clic derecho) sobre la cita** | ❌ **Falta** | Ver ficha / cambiar hora / modificar duración / confirmar transferencia / marcar atendido / anular |
| Popup éxito "Cita agendada" + mini-agenda del día | 🟡 Parcial | Hay confirmación; falta el resumen visual con mini-agenda |
| **"Agregar al calendario"** (.ics / Google) | ✅ Ya está | Agregado 2026-06-24 (`CalendarButton`) |

### 3. Pacientes (lista)
| Ventana del prototipo | Estado | Detalle |
|---|---|---|
| Lista con búsqueda + avatares | ✅ Ya está | `PatientList.tsx` |
| Chips de filtro por etiqueta | ✅ Ya está | Agregado (tags + chips) |
| **Banner "Campañas de re-cita por WhatsApp"** (pacientes a contactar hoy) | ❌ **Falta** | Lista expandible de re-citas pendientes con link WhatsApp directo |

### 4. Ficha del paciente (pestañas)
| Pestaña del prototipo | Estado | Detalle |
|---|---|---|
| Ficha Clínica (antecedentes, piel, hábitos, evaluación) | ✅ Ya está | `ClinicalRecordTab` — misma estructura + chips |
| Edad editable / calculada en 1 clic | ✅ Ya está | Edad en vivo agregada 2026-06-24 |
| Procedimientos (historial, dosis, lote, fotos) | ✅ Ya está | `ProceduresTab` |
| Mapa facial / antropometría | 🟡 Parcial | Existe dentro de Procedimientos (2D/3D/360/Ricketts); el prototipo lo tiene como pestaña aparte |
| Consentimientos + firma remota | ✅ Ya está (mejor) | `ConsentsTab` con `sign_token`, link WhatsApp/email |
| Resumen IA | ✅ Ya está | `AiSummaryTab` |
| **Receta / Indicaciones post tratamiento** | ❌ **Falta** | Pestaña con plantillas de indicaciones, imprimir A4, enviar por WhatsApp |
| **Auditoría IA** (chequea ficha incompleta) | ❌ **Falta** | Detecta: falta consentimiento, antecedentes incompletos, sin captación, pago pendiente, mapa facial vacío |
| **Imágenes** (galería agrupada por procedimiento/fecha) | ❌ **Falta** | Pestaña dedicada con grid de miniaturas + subir imagen |
| **Atenciones/Facturación** (Total / Pagado / Saldo) | 🟡 Parcial | Tu tab "Atenciones" lista citas; el prototipo lleva cobros con saldo pendiente |
| Captación / Campaña (origen del paciente) | 🟡 Parcial | El origen se guarda al crear; el prototipo lo edita en una pestaña |
| Notas clínicas (pestaña dedicada) | 🟡 Parcial | Hay "Notas internas" en Datos; el prototipo tiene pestaña propia |

### 5. Servicios
| Ventana del prototipo | Estado | Detalle |
|---|---|---|
| Catálogo por categoría + facial/corporal | ✅ Ya está | `ServiceList` con secciones |
| Buscador | ✅ Ya está | Agregado |
| Activar/desactivar (toggle) | ✅ Ya está | |
| Modal editar servicio | ✅ Ya está | `ServiceForm` |

### 6. Equipo / Profesionales
| Ventana del prototipo | Estado | Detalle |
|---|---|---|
| Lista + crear cuenta + permisos | ✅ Ya está | Permisos granulares, avatar |
| **Clave de confirmación (PIN) del profesional** | ❌ **Falta** | El prototipo pide PIN para editar sesiones ya registradas |

### 7. Inventario
| Ventana del prototipo | Estado | Detalle |
|---|---|---|
| Lista + categorías + KPIs clickeables | ✅ Ya está | KPIs clickeables agregados |
| Lotes / fechas de vencimiento | ✅ Ya está | `inventory_batches` |
| Movimientos +/- y historial | ✅ Ya está | |
| **Escanear QR** (InvScanModal) | ❌ **Falta** | Escáner de código para mover stock |
| **"Procedimiento de costo"** (composición de insumos) | 🟡 Parcial | Existe `service_products`; falta el modal dedicado de armado de costo |
| Importar desde factura | ✅ Ya está | `InvoiceImport` |

### 8. Caja
| Ventana del prototipo | Estado | Detalle |
|---|---|---|
| Ingresos / egresos / costo insumos / neto | ✅ Ya está | `CashRegisterView` |
| Desglose por método y categoría | ✅ Ya está | |
| **Cierre de caja diario** (modal + PDF) | ❌ **Falta** | Cierre con resumen del día y descarga |

### 9. Marketing
| Ventana del prototipo | Estado | Detalle |
|---|---|---|
| CRUD de campañas | ✅ Ya está | `CampaignList` / `CampaignForm` |
| **Agrupado Activas / Pausadas** + métricas Meta (alcance/leads/inversión) | 🟡 Parcial | Falta el agrupado por estado y las mini-stats por campaña |
| Link a Meta Ads Manager | 🟡 Parcial | Hay link a Canva; falta acceso directo a Meta |

### 10. Automatizaciones
| Ventana del prototipo | Estado | Detalle |
|---|---|---|
| Tarjetas con toggle + editar mensaje | ✅ Ya está | `AutomationsView` (4 reglas) |
| **Regla "Recordatorio mañana del día" (08:30)** | ❌ **Falta** | |
| **Regla "Reactivación 90 días inactivo"** | ❌ **Falta** | |
| **Regla "Indicaciones post tratamiento"** | ❌ **Falta** | Depende de la pestaña Receta |
| Regla "Solicitud de reseña Google" | 🟡 Parcial | Existe "review" genérico; afinar a Google |

### 11. Colaboraciones
| Ventana del prototipo | Estado | Detalle |
|---|---|---|
| Bandeja de postulaciones + link público | ✅ Ya está | `CollaborationsView` |
| Tarjetas-resumen clickeables (incl. Rechazadas) | ✅ Ya está | Agregado 2026-06-24 |
| **Modal de detalle** con Aprobar/Rechazar + redes sociales + propuesta | 🟡 Parcial | Hay cambio de estado por select; falta modal de detalle con redes/propuesta y tipo Influencer/Marca |

### 12. Pendientes
| Ventana del prototipo | Estado | Detalle |
|---|---|---|
| Lista de tareas con check + prioridad + vencimiento | ✅ Ya está | `PendingView` |
| **Grupos automáticos** (consentimientos por firmar, citas sin confirmar, reminders, WhatsApp, redes) | ❌ **Falta** | El prototipo suma secciones derivadas del estado del sistema |

### 13. Sala de Espera
| Ventana del prototipo | Estado | Detalle |
|---|---|---|
| Kanban: Por llegar → Espera → Atención → Fin | ✅ Ya está | `WaitingRoomView` |

### 14. Administración
| Ventana del prototipo | Estado | Detalle |
|---|---|---|
| Equipo, registro de actividad, datos/facturación, respaldo/exportar | ✅ Ya está | `AdministrationView` (4 tabs) |

### 15. Configuración
| Ventana del prototipo | Estado | Detalle |
|---|---|---|
| Datos clínica + link reserva + QR | ✅ Ya está | |
| Editor de horarios por día | ✅ Ya está | `ScheduleEditor` |
| Conectar WhatsApp | ✅ Ya está | Meta + UltraMsg |

### 16. Integraciones
| Ventana del prototipo | Estado | Detalle |
|---|---|---|
| **Página "Integraciones"** (Meta Ads, Gmail, Drive, Calendar, Gemini, WhatsApp, Landing) | ❌ **Falta** | Tu app conecta WhatsApp en Configuración; falta la página de tarjetas Conectar/Conectado |

### 17. Análisis facial avanzado (jc-face)
| Herramienta del prototipo | Estado | Detalle |
|---|---|---|
| Puntos de punción sobre foto + diagrama | ✅ Ya está | `FacialDiagram` / `Face3DDiagram` / `Face360Spin` |
| Plano de Ricketts (línea E) | ✅ Ya está | `FaceRicketts` |
| **Proporción Áurea con IA (MediaPipe, score 0–100)** | ❌ **Falta** | Análisis automático de tercios/quintos/simetría con puntaje |

### 18. Copilot IA
| Ventana del prototipo | Estado | Detalle |
|---|---|---|
| Asistente flotante con acciones | ✅ Ya está | `Copilot` |
| Dictado por voz (es-CL) | 🟡 Parcial | El prototipo dicta por voz y arma "Dar cita" |

### 19. App de pacientes (jc-jcm / jc-mobile) — *fuera de alcance del panel*
| Ventana del prototipo | Estado | Detalle |
|---|---|---|
| App consumidor (feed de contenido, Glow Points, minijuegos, Firebase) | ⚪ N/A | Es la app separada de pacientes de JC; tu portal de paciente es distinto. No es parte del panel admin |

---

## 🎯 Gaps reales priorizados (lo que conviene construir)

### Prioridad ALTA (más valor para vender / operar)
1. ❌ **Modal "Dar cita" con grilla visual de horarios** (clic en bloque de 30 min) — es la diferencia más visible del prototipo.
2. ❌ **Receta / Indicaciones post tratamiento** (pestaña en ficha: plantillas + imprimir A4 + WhatsApp).
3. ❌ **Auditoría IA de la ficha** (chequea consentimiento/antecedentes/captación/pago/mapa facial).
4. ❌ **Cierre de caja diario** (modal con resumen + descarga).
5. 🟡 **Banner de re-citas por WhatsApp** en Pacientes (pacientes a contactar hoy).

### Prioridad MEDIA
6. ❌ **Pestaña Imágenes** en la ficha (galería por procedimiento/fecha).
7. ❌ **Menú contextual (clic derecho)** sobre la cita en el calendario.
8. 🟡 **Facturación por paciente** (Total / Pagado / Saldo) en la pestaña Atenciones.
9. ❌ **Automatizaciones**: regla recordatorio 08:30 del día + reactivación 90 días + indicaciones post.
10. ❌ **Página Integraciones** (tarjetas Conectar/Conectado).
11. 🟡 **Colaboraciones**: modal de detalle con Aprobar/Rechazar, redes y tipo Influencer/Marca.

### Prioridad BAJA (pulido / nice-to-have)
12. 🟡 **Marketing**: agrupar Activas/Pausadas + mini-stats por campaña.
13. ❌ **Proporción Áurea con IA** (puntaje facial automático con MediaPipe).
14. ❌ **PIN de confirmación** del profesional para editar sesiones.
15. ❌ **Inventario**: escáner QR + modal de procedimiento de costo.
16. ❌ **Pendientes**: secciones automáticas derivadas del estado del sistema.
17. 🟡 **Popup de éxito de cita** con mini-agenda del día.
18. 🟡 **Copilot por voz** (dictado es-CL).

---

## Cómo mantener este mapa

- Cuando el socio mande una captura de una ventana **nueva o que cambió**, basta una línea ("mira el modal X, ahora tiene Y"). Yo lo confirmo contra el código y actualizo el estado aquí.
- A medida que se construya cada gap, se cambia su ✅/🟡/❌ y se nota la fecha.
- No hace falta reenviar el prototipo completo: el código ya está analizado y este archivo es la fuente única de verdad de la comparación.
