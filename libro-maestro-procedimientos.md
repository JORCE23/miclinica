# Libro Maestro de Procedimientos — JC Medical

**Versión 1.0** · Moneda: CLP · Plataforma médica (estilo Medilink)

> **Nota clínica importante:** todas las dosis, unidades y tiempos son **referenciales**. Las unidades de toxina expresadas corresponden a *onabotulinumtoxinA / incobotulinumtoxinA* (relación 1:1). Para *abobotulinumtoxinA* (Dysport) aplicar factor de conversión ≈ 2.5–3:1. Todo debe ajustarse al producto, a la anatomía del paciente y al criterio del profesional tratante. Los precios quedan en `null` para que los cargues tú.

---

## 1. Esquema de datos (cómo está estructurado el JSON)

Cada procedimiento tiene estos campos, pensados para mapear directo a tu base de datos / catálogo de servicios:

| Campo | Tipo | Uso en la web |
|---|---|---|
| `id` | string (slug) | Identificador único, ideal como clave primaria |
| `nombre` | string | Nombre visible del servicio |
| `categoria` | string | Para filtros y agrupación en el catálogo |
| `descripcion` | string | Texto clínico / informativo del servicio |
| `zonas` | array | Zonas tratadas (selección o checklist) |
| `producto_referencia` | array | Marcas/productos sugeridos |
| `dosis_unidades` | string | Dosis referencial por sesión |
| `via` | string | Vía de aplicación |
| `duracion_sesion_min` | number | Tiempo clínico activo |
| `duracion_agenda_min` | number | **Bloque a reservar en agenda** (incluye prep, foto, consentimiento) |
| `inicio_efecto` | string | Tiempo hasta primeros resultados |
| `duracion_efecto` | string | Permanencia del resultado |
| `sesiones_recomendadas` | string | Nº de sesiones por plan |
| `intervalo_sesiones` | string | Frecuencia entre sesiones |
| `recuperacion` | string | Downtime / recuperación social |
| `indicaciones` | array | Para qué está indicado |
| `usa_contraindicaciones_generales` | bool | Hereda el bloque general de contraindicaciones |
| `usa_contraindicaciones_toxina` | bool | Suma las contraindicaciones específicas de toxina |
| `usa_cuidados_post` | string | Referencia al bloque de cuidados que aplica |
| `requiere_consentimiento` | bool | Para gatillar el consentimiento informado en la ficha |
| `requiere_foto_clinica` | bool | Para gatillar el módulo antes/después |
| `precio_clp` | number/null | Precio (lo defines tú) |
| `campo_personalizado` | string (opcional) | Marca qué campo(s) debe(n) ser editables por el profesional |
| `activo` | bool | Mostrar u ocultar en el catálogo |

**Bloques reutilizables** (definidos una sola vez en el JSON y referenciados por cada procedimiento, para no repetir texto):
`contraindicaciones_generales_inyectables`, `contraindicaciones_especificas_toxina`, `cuidados_post_toxina`, `cuidados_post_relleno_ah`, `cuidados_post_bioestimulador`.

---

## 2. Contraindicaciones y cuidados (bloques compartidos)

### Contraindicaciones generales (todo inyectable)
Embarazo y lactancia · infección o lesión activa en la zona · alergia a algún componente · enfermedad autoinmune/inflamatoria activa · trastornos de coagulación o anticoagulantes (valorar) · tratamiento oncológico activo (valorar) · expectativas no realistas o sospecha de dismorfia corporal · menor de edad sin indicación justificada.

### Contraindicaciones específicas de toxina
Enfermedades neuromusculares (miastenia gravis, Eaton-Lambert, ELA) · uso de aminoglucósidos u otros fármacos que alteren la transmisión neuromuscular.

### Cuidados post — Toxina
No masajear ni presionar 4–6 h · posición vertical 4 h · sin ejercicio intenso 24 h · evitar calor (sauna/sol) 24–48 h · sin alcohol el día del procedimiento.

### Cuidados post — Relleno con ácido hialurónico
Frío local · sin maquillaje 12–24 h · sin ejercicio/calor/alcohol 24–48 h · no masajear salvo indicación · inflamación/hematoma transitorio normal.

### Cuidados post — Bioestimulador
Masaje según producto (Sculptra: regla 5-5-5) · hidratación abundante · evitar calor y ejercicio 24–48 h · resultados progresivos en semanas.

---

## 3. Catálogo por categoría

### Toxina Botulínica
| Procedimiento | Zonas | Dosis ref. | Efecto | Agenda |
|---|---|---|---|---|
| 3 Zonas | Frente, glabela, patas de gallo | 40–60 U | 3–6 meses | 40 min |
| 4 Zonas | + 4ª zona según evaluación | 50–70 U | 3–6 meses | 45 min |
| Full Face (8 zonas) | 3 tercios faciales | 70–100 U | 3–6 meses | 60 min |
| Fulltox (8 + cuello) | Full face + Nefertiti | 100–150 U | 3–5 meses | 70 min |
| Bruxismo | Maseteros | 20–30 U/lado | 4–6 meses | 40 min |
| Hiperhidrosis | Axilas / palmas | 50 U/axila · 100 U/palma | 4–9 meses | 50 min |
| Mesobotox | Tercio inferior, cuello, frente | Microgotas diluidas | 3–4 meses | 45 min |
| Trap Botox | Trapecios | 25–50 U/lado | 3–4 meses | 40 min |
| Migraña (PREEMPT) | Frontal, temporal, occipital, cervical, trapecio | 155–195 U / 31–39 puntos | ~12 sem | 50 min |

### Ácido Hialurónico
| Procedimiento | Zonas | Volumen ref. | Efecto | Agenda |
|---|---|---|---|---|
| Rinomodelación | Dorso, punta, radix | 0.5–1 ml | 12–18 meses | 50 min |
| Aumento de labios | Cuerpo labial | 1 ml | 6–12 meses | 50 min |
| Perfilado de labios | Bermellón, arco de Cupido | 0.5–1 ml | 6–12 meses | 45 min |
| Aumento de mentón | Mentón | 1–2 ml | 12–18 meses | 45 min |
| Relleno de ojeras | Surco lagrimal | 0.5–1 ml | 9–12 meses | 45 min |
| Aumento de pómulos | Malar | 1–2 ml | 12–18 meses | 50 min |
| Marcación mandibular | Ángulo y borde mandibular | 2–4 ml | 12–18 meses | 60 min |
| Armonización facial | Múltiples áreas | Variable (plan) | 12–18 meses | 90 min |

### Bioestimuladores de Colágeno
| Procedimiento | Producto | Sesiones | Efecto |
|---|---|---|---|
| Bioestimulación de colágeno (general) | Editable | 1–3 | 12–24 meses |
| Sculptra | PLLA | 2–3 | hasta ~2 años |
| Radiesse | CaHA | 1–2 | 12–18 meses |

### Mesoterapia y Revitalización
| Procedimiento | Vía | Sesiones | Notas |
|---|---|---|---|
| Mesoterapia | Intradérmica / nappage | 3–5 | Rostro, cuello, escote, capilar |
| NCTF con Dermapen | Microneedling | 3–4 | NCTF 135 HA superficial |
| NCTF inyectado | Intradérmica | 3–4 | Revitalización más profunda |
| Pink Glow | Microinyecciones | 3–5 | Verificar composición de la marca |
| Exosomas | Microneedling / tópico | 3–4 | Verificar regulación sanitaria |
| Skinbooster | Microdepósitos | 2–3 | **Especificar marca** |

### Lipolíticos Inyectables
**Zonas:** papada/submentón · abdomen · flancos (cartucheras) · espalda (rollitos) · brazos · interior de muslos · rodillas · pseudoginecomastia.
2–6 sesiones cada 3–4 semanas. No es tratamiento para obesidad; requiere grasa localizada y peso estable.

### Otro (Especificar)
Plantilla con todos los campos editables para registrar procedimientos no listados.

---

## 4. Sugerencias para la integración en la web

- **Filtro por `categoria`** en el catálogo de servicios.
- Usa `duracion_agenda_min` para el motor de **agenda/reservas** (es distinto al tiempo clínico).
- Gatilla automáticamente el **consentimiento informado** cuando `requiere_consentimiento = true`.
- Gatilla el módulo **antes/después** cuando `requiere_foto_clinica = true` (te sirve para tu sistema de plantillas en degradado gris).
- Renderiza las contraindicaciones combinando los bloques según `usa_contraindicaciones_*` (evita duplicar texto en cada ficha).
- Mantén `precio_clp` editable desde un panel de administración; deja un historial si quieres versionar precios.
- El campo `campo_personalizado` te indica dónde habilitar inputs libres (ej. marca de Skinbooster, producto de bioestimulación, o "Otro" completo).

---

*Documento de referencia interno para JC Medical. Contenido clínico-referencial; la indicación, dosis y técnica son responsabilidad del profesional tratante.*
