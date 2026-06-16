import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/security/auth-guard"

// Carga un set de productos típicos de clínica estética con stock aleatorio.
// Útil para ver el módulo funcionando de inmediato. No duplica si ya hay productos.
const SAMPLE = [
  { name: "Ácido Hialurónico 1ml", category: "Rellenos", unit: "jeringa", min_stock: 5 },
  { name: "Toxina Botulínica 100U", category: "Toxinas", unit: "vial", min_stock: 3 },
  { name: "Hilos Tensores PDO", category: "Hilos", unit: "caja", min_stock: 4 },
  { name: "Vitamina C Sérum", category: "Skincare", unit: "frasco", min_stock: 6 },
  { name: "Agujas 30G", category: "Insumos", unit: "caja", min_stock: 10 },
  { name: "Guantes Nitrilo M", category: "Insumos", unit: "caja", min_stock: 8 },
  { name: "Mascarilla Hidratante", category: "Skincare", unit: "unidad", min_stock: 12 },
  { name: "Anestésico Tópico", category: "Insumos", unit: "tubo", min_stock: 5 },
  { name: "Gasas Estériles", category: "Insumos", unit: "paquete", min_stock: 15 },
  { name: "Alcohol Gel 500ml", category: "Limpieza", unit: "botella", min_stock: 6 },
]

export async function POST() {
  try {
    const { context, errorResponse } = await requireAuth("clinic_admin")
    if (errorResponse) return errorResponse

    const supabase = createClient()

    // Evitar duplicados: si ya hay productos, no sembramos.
    const { count } = await supabase
      .from("inventory_products")
      .select("id", { count: "exact", head: true })
      .eq("clinic_id", context!.clinicId)
    if ((count || 0) > 0) {
      return NextResponse.json({ ok: true, inserted: 0, note: "Ya hay productos cargados" })
    }

    const rows = SAMPLE.map((p) => {
      // Stock aleatorio; a algunos los dejamos bajo el mínimo para ver las alertas.
      const roll = Math.random()
      const stock =
        roll < 0.25 ? Math.floor(Math.random() * p.min_stock) // bajo/agotado
          : Math.floor(p.min_stock + Math.random() * p.min_stock * 3) // normal
      return {
        clinic_id: context!.clinicId,
        name: p.name,
        category: p.category,
        unit: p.unit,
        stock,
        min_stock: p.min_stock,
        cost: Math.round((5000 + Math.random() * 80000) / 100) * 100,
      }
    })

    const { error } = await supabase.from("inventory_products").insert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true, inserted: rows.length })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
