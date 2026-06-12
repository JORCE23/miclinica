import { z } from "zod"

export const campaignSchema = z.object({
  name: z.string().min(2, "Nombre de campaña requerido"),
  type: z.enum(["email", "whatsapp", "sms"]),
  status: z.enum(["draft", "active", "completed", "paused"]).default("draft"),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  budget: z.coerce.number().optional().nullable(),
  spent: z.coerce.number().optional().nullable(),
  reach: z.coerce.number().optional().nullable(),
  conversions: z.coerce.number().optional().nullable(),
  description: z.string().optional(),
})

export type CampaignFormValues = z.infer<typeof campaignSchema>
