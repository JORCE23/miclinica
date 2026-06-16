import { InventoryMovementsView } from "@/components/admin/inventory/InventoryMovementsView"

export const metadata = {
  title: "Historial de movimientos | Inventario",
  description: "Entradas, salidas y ajustes del inventario",
}

export default function InventoryMovementsPage() {
  return <InventoryMovementsView />
}
