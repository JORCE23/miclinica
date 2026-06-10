import * as z from "zod"

export const serviceSchema = z.object({
  name: z.string({
    required_error: "El nombre del servicio es requerido",
    invalid_type_error: "El nombre debe ser texto",
  }).trim().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  
  description: z.string().trim().optional(),
  
  duration_minutes: z.coerce.number({
    required_error: "La duración es requerida",
    invalid_type_error: "La duración debe ser un número",
  }).min(5, { message: "La duración mínima es de 5 minutos" }),
  
  price: z.coerce.number({
    required_error: "El precio es requerido",
    invalid_type_error: "El precio debe ser un número",
  }).min(0, { message: "El precio no puede ser negativo" }).optional(),
  
  loyalty_points_earned: z.coerce.number({
    required_error: "Los puntos son requeridos",
    invalid_type_error: "Los puntos deben ser un número",
  }).min(0, { message: "Los puntos no pueden ser negativos" }).default(0),
  
  is_active: z.boolean().default(true),

  // Nuevos campos del Libro Maestro de Procedimientos
  category: z.string().trim().optional(),
  service_code: z.string().trim().optional(),
  zones: z.array(z.string()).optional(),
  reference_products: z.array(z.string()).optional(),
  dose_units: z.string().trim().optional(),
  application_route: z.string().trim().optional(),
  clinical_duration_min: z.coerce.number().min(0).optional(),
  effect_onset: z.string().trim().optional(),
  effect_duration: z.string().trim().optional(),
  recommended_sessions: z.string().trim().optional(),
  sessions_interval: z.string().trim().optional(),
  recovery_time: z.string().trim().optional(),
  indications: z.array(z.string()).optional(),
  use_general_contraindications: z.boolean().default(false).optional(),
  use_toxin_contraindications: z.boolean().default(false).optional(),
  post_care_type: z.string().trim().optional(),
  requires_consent: z.boolean().default(false).optional(),
  requires_clinical_photo: z.boolean().default(false).optional(),
  custom_field: z.string().trim().optional(),
})

export type ServiceFormValues = z.infer<typeof serviceSchema>
