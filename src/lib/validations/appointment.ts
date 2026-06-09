import * as z from "zod"

export const appointmentSchema = z.object({
  patient_id: z.string({
    required_error: "El paciente es requerido",
  }).uuid("ID de paciente inválido"),
  
  service_id: z.string({
    required_error: "El servicio es requerido",
  }).uuid("ID de servicio inválido").optional().nullable(),
  
  scheduled_at: z.string({
    required_error: "La fecha y hora son requeridas",
  }).refine((val) => !isNaN(Date.parse(val)), { message: "Fecha y hora inválidas" }),
  
  duration_minutes: z.coerce.number({
    required_error: "La duración es requerida",
  }).min(5, "Mínimo 5 minutos"),
  
  price: z.coerce.number().min(0, "El precio no puede ser negativo").optional().nullable(),
  
  notes: z.string().trim().optional(),
  
  status: z.enum(["pendiente", "confirmada", "completada", "cancelada", "no_asistio"]).default("pendiente"),
})

export type AppointmentFormValues = z.infer<typeof appointmentSchema>
