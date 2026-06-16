"use client"

import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Award, ArrowUpRight, ArrowDownRight, RefreshCcw } from "lucide-react"

export function LoyaltyTab({ patientId }: { patientId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["loyalty", patientId],
    queryFn: async () => {
      const res = await fetch(`/api/loyalty/${patientId}`)
      if (!res.ok) throw new Error("Error al cargar puntos")
      return res.json()
    }
  })

  if (isLoading) return <div className="p-8 text-center">Cargando puntos...</div>
  if (!data) return null

  const { account, transactions } = data

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "ganados": return <ArrowUpRight className="h-4 w-4 text-emerald-500" />
      case "canjeados": return <ArrowDownRight className="h-4 w-4 text-[#7B9AB5]" />
      case "ajuste": return <RefreshCcw className="h-4 w-4 text-blue-500" />
      case "expirados": return <ArrowDownRight className="h-4 w-4 text-orange-500" />
      default: return null
    }
  }

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case "ganados": return <Badge className="bg-emerald-500">Ganados</Badge>
      case "canjeados": return <Badge variant="destructive">Canjeados</Badge>
      case "ajuste": return <Badge variant="secondary">Ajuste</Badge>
      case "expirados": return <Badge variant="outline">Expirados</Badge>
      default: return <Badge>{type}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Saldo Actual</CardTitle>
            <Award className="h-5 w-5 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-amber-400">{account.total_points}</div>
            <p className="text-sm text-slate-300 mt-1">Puntos disponibles para canjear</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Puntos Históricos</CardTitle>
            <Award className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{account.lifetime_points}</div>
            <p className="text-sm text-muted-foreground mt-1">Total de puntos ganados desde siempre</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Historial de Transacciones</h3>
        {transactions?.length === 0 ? (
          <div className="text-center py-8 border border-dashed rounded-2xl text-muted-foreground">
            No hay transacciones de puntos registradas.
          </div>
        ) : (
          <div className="rounded-2xl border border-border/70 bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Puntos</TableHead>
                  <TableHead>Descripción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions?.map((tx: any) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium">
                      {format(new Date(tx.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getTransactionIcon(tx.type)}
                        {getTransactionBadge(tx.type)}
                      </div>
                    </TableCell>
                    <TableCell className={`font-bold ${tx.points > 0 ? 'text-emerald-500' : 'text-[#7B9AB5]'}`}>
                      {tx.points > 0 ? `+${tx.points}` : tx.points}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[300px] truncate">
                      {tx.description || "Asignación automática"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
