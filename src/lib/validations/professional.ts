import { z } from "zod"

export const professionalSchema = z.object({
  full_name: z.string().min(2, "Nombre requerido"),
  specialty: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  avatar_url: z.string().optional(),
  is_active: z.boolean().default(true),
})

export type ProfessionalFormValues = z.infer<typeof professionalSchema>
