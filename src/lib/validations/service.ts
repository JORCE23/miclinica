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
})

export type ServiceFormValues = z.infer<typeof serviceSchema>
