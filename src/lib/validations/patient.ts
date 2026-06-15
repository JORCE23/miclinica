import * as z from "zod"
import { validateRut } from "./rut"

// Debe coincidir EXACTAMENTE con el CHECK de profiles.source en la base de datos.
export const PATIENT_SOURCES = [
  "meta_ads",
  "google",
  "referido",
  "organico",
  "directo",
  "whatsapp",
  "otro",
] as const

export const patientSchema = z.object({
  full_name: z
    .string({
      required_error: "El nombre completo es requerido",
      invalid_type_error: "El nombre debe ser texto",
    })
    .trim()
    .min(2, { message: "El nombre completo es requerido" }),

  rut: z
    .string({ invalid_type_error: "El RUT debe ser texto" })
    .trim()
    .optional()
    .refine((val) => {
      if (!val) return true
      return validateRut(val)
    }, { message: "El RUT no es válido" }),

  birth_date: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true
      const d = new Date(val)
      if (isNaN(d.getTime())) return false
      return d <= new Date() // sin fechas futuras
    }, { message: "La fecha de nacimiento no puede ser futura" }),

  phone: z.string().trim().optional(),

  email: z
    .string({
      required_error: "El correo es requerido",
      invalid_type_error: "El correo debe ser texto",
    })
    .trim()
    .min(1, { message: "El correo es requerido" })
    .email({ message: "Debe ser un correo válido" }),

  // Opcional: si viene vacía, el servidor genera una contraseña provisional segura.
  password: z
    .union([
      z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
      z.literal(""),
      z.undefined(),
    ])
    .optional(),

  // Enum cerrado para respetar el CHECK de la BD.
  source: z
    .union([z.enum(PATIENT_SOURCES), z.literal(""), z.undefined()])
    .optional(),

  notes: z.string().optional(),
})

export type PatientFormValues = z.infer<typeof patientSchema>
