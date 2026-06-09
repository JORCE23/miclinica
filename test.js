const z = require("zod");
const s = z.object({ email: z.string().email("Debe ser un correo válido") });
const res = s.safeParse({ email: "invalid" });
if (!res.success) {
  console.log(JSON.stringify(res.error.issues, null, 2));
}
