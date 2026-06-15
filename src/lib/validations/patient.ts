import * as z from "zod"
import { validateRut } from "./rut"

export const patientSchema = z.object({
  full_name: z.string({
    required_error: "El nombre completo es requerido",
    invalid_type_error: "El nombre debe ser texto",
  }).trim().min(2, { message: "El nombre completo es requerido" }),
  
  rut: z.string({
    invalid_type_error: "El RUT debe ser texto",
  }).trim().optional().refine((val) => {
    if (!val) return true;
    return validateRut(val);
  }, { message: "El RUT no es válido" }),
  
  birth_date: z.string().optional().refine((val) => {
    if (!val) return true;
    return new Date(val) <= new Date();
  }, { message: "La fecha de nacimiento no puede ser futura" }),
  
  phone: z.string().trim().optional().refine((val) => {
    if (!val) return true;
    return /^(\+?56)?9\d{8}$/.test(val.replace(/[\s-]/g, ''));
  }, { message: "El teléfono debe ser un celular chileno válido (+569...)" }),
  
  email: z.string({
    required_error: "El correo es requerido",
    invalid_type_error: "El correo debe ser texto",
  }).trim().min(1, { message: "El correo es requerido" }).email({ message: "Debe ser un correo válido" }),
  
  password: z.union([
    z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
    z.literal(''),
    z.undefined()
  ]).optional(),

  source: z.enum(['meta_ads', 'google', 'referido', 'organico', 'directo', 'whatsapp', 'otro']).optional(),
  
  notes: z.string().optional(),
})

export type PatientFormValues = z.infer<typeof patientSchema>
