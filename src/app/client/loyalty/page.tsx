import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Gift, TrendingUp, TrendingDown, Info, Award } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export const metadata = {
  title: "Mis Puntos | Clínica Estética",
}

export default async function ClientLoyaltyPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Account
  const { data: loyalty } = await supabase
    .from("loyalty_accounts")
    .select("total_points, lifetime_points")
    .eq("patient_id", user.id)
    .single()

  // Transactions
  const { data: transactions } = await supabase
    .from("loyalty_transactions")
    .select("*")
    .eq("patient_id", user.id)
    .order("created_at", { ascending: false })

  const getTxIcon = (type: string) => {
    switch(type) {
      case 'ganados': return <TrendingUp className="h-5 w-5 text-emerald-500" />
      case 'canjeados': return <TrendingDown className="h-5 w-5 text-[#8A929B]" />
      case 'ajuste': return <Info className="h-5 w-5 text-slate-500" />
      case 'expirados': return <TrendingDown className="h-5 w-5 text-slate-500" />
      default: return <Award className="h-5 w-5 text-amber-500" />
    }
  }

  const getTxColor = (type: string, points: number) => {
    if (points > 0) return "text-emerald-600 dark:text-emerald-400 font-bold"
    if (points < 0) return "text-[#1A1A14] dark:text-rose-400 font-bold"
    return "text-slate-600 dark:text-slate-400"
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
          <Gift className="h-8 w-8 text-amber-500" /> Mis Puntos
        </h1>
        <p className="text-muted-foreground mt-2">
          Programa de fidelidad. Gana puntos por tus tratamientos y canjéalos por beneficios exclusivos.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
          <CardContent className="p-8 text-center">
            <h2 className="text-lg font-medium text-amber-800 dark:text-amber-200 mb-2">Saldo Disponible</h2>
            <div className="flex justify-center items-end gap-2">
              <span className="text-6xl font-black text-amber-600 dark:text-amber-500">
                {loyalty?.total_points || 0}
              </span>
              <span className="text-xl font-bold text-amber-700/60 dark:text-amber-400/60 mb-2">pts</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-8 flex flex-col justify-center h-full">
            <h2 className="text-sm font-medium text-muted-foreground mb-1">Puntos Históricos</h2>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              {loyalty?.lifetime_points || 0} <span className="text-lg font-normal text-muted-foreground">pts</span>
            </p>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 mb-2">
              <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: '45%' }}></div>
            </div>
            <p className="text-xs text-muted-foreground text-right">Faltan 550 pts para el nivel Oro</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 pt-6">
        <h2 className="text-xl font-semibold border-b pb-2">Historial de Movimientos</h2>
        
        {!transactions || transactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed">
            Aún no tienes movimientos de puntos registrados.
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="divide-y divide-border">
              {transactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white dark:bg-slate-950 rounded-full shadow-sm border">
                      {getTxIcon(tx.type)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white capitalize">{tx.type}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{format(new Date(tx.created_at), "d 'de' MMMM, yyyy", { locale: es })}</span>
                        {tx.description && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[200px] sm:max-w-md">{tx.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={`text-lg text-right ${getTxColor(tx.type, tx.points)}`}>
                    {tx.points > 0 ? '+' : ''}{tx.points}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
