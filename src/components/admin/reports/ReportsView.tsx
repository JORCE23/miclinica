"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { Button } from "@/components/ui/button"
import { Download, Calendar as CalendarIcon, Loader2 } from "lucide-react"

export function ReportsView() {
  const [dateRange, setDateRange] = useState("Este Año")

  const { data, isLoading, error } = useQuery({
    queryKey: ["reports", dateRange],
    queryFn: async () => {
      const res = await fetch(`/api/reports?range=${encodeURIComponent(dateRange)}`)
      if (!res.ok) throw new Error("Error fetching reports")
      return res.json()
    }
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#162439]" />
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500 p-8 text-center">Error al cargar reportes.</div>
  }

  const { monthlyRevenue = [], servicesData = [], keyMetrics = {} } = data || {}
  const clpFmt = (n: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n || 0)

  const handleExportCSV = () => {
    if (!data) return

    // BOM para que Excel detecte correctamente el UTF-8 y tildes
    let csvContent = "\uFEFF" 

    csvContent += "--- INGRESOS MENSUALES ---\n"
    csvContent += "Mes;Ingresos\n"
    monthlyRevenue.forEach((row: any) => {
      csvContent += `${row.name};${row.ingresos}\n`
    })
    
    csvContent += "\n--- SERVICIOS MÁS POPULARES ---\n"
    csvContent += "Servicio;Citas\n"
    servicesData.forEach((row: any) => {
      csvContent += `"${row.name}";${row.citas}\n`
    })

    csvContent += "\n--- MÉTRICAS CLAVE ---\n"
    csvContent += `Ticket Promedio;${keyMetrics.ticketPromedio}\n`
    csvContent += `Ingresos Hoy;${keyMetrics.revenueToday}\n`
    csvContent += `Retención Pacientes (%);${keyMetrics.retencionPacientes}\n`
    csvContent += `No-Show Rate (%);${keyMetrics.noShowRate}\n`

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `reporte_estadisticas_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between p-4 rounded-2xl border border-border/70 bg-card shadow-soft">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-[#6B7E94]" />
          <select 
            className="bg-transparent border-none text-[#162439] font-medium focus:ring-0 cursor-pointer"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option>Este Mes</option>
            <option>Últimos 3 Meses</option>
            <option>Últimos 6 Meses</option>
            <option>Este Año</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} disabled={isLoading || !data} className="bg-brand hover:bg-brand-dark text-white">
            <Download className="w-4 h-4 mr-2" /> Exportar CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-border/70 bg-card shadow-soft">
          <h2 className="text-lg font-semibold text-[#162439] mb-6">Evolución de Ingresos</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenue} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="repRevFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0D9488" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#0D9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#EEF2F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} width={48} tickFormatter={(value) => `$${value/1000}k`} />
                <RechartsTooltip
                  cursor={{stroke: '#0D9488', strokeWidth: 1, strokeDasharray: '4 4'}}
                  contentStyle={{borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 8px 24px -8px rgb(16 36 57 / 0.14)', fontSize: '13px'}}
                  labelStyle={{fontWeight: 600, color: '#162439'}}
                  formatter={(value: any) => [clpFmt(Number(value)), 'Ingresos']}
                />
                <Area type="monotone" dataKey="ingresos" stroke="#0D9488" strokeWidth={2.5} fill="url(#repRevFill)" dot={false} activeDot={{r: 5, fill: '#0D9488', stroke: '#fff', strokeWidth: 2}} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-border/70 bg-card shadow-soft">
          <h2 className="text-lg font-semibold text-[#162439] mb-6">Servicios más populares</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={servicesData} layout="vertical" margin={{ left: 20 }}>
                <defs>
                  <linearGradient id="repBar" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0D9488" />
                    <stop offset="100%" stopColor="#2DD4BF" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="#EEF2F6" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#162439', fontSize: 12, fontWeight: 500}} width={110} />
                <RechartsTooltip
                  cursor={{fill: 'rgb(13 148 136 / 0.06)'}}
                  contentStyle={{borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 8px 24px -8px rgb(16 36 57 / 0.14)', fontSize: '13px'}}
                  formatter={(value: any) => [`${value} citas`, 'Frecuencia']}
                />
                <Bar dataKey="citas" fill="url(#repBar)" radius={[0, 6, 6, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-border/70 bg-card shadow-soft">
        <h2 className="text-lg font-semibold text-[#162439] mb-4">Métricas Clave</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-border/70 bg-card">
            <p className="text-sm text-[#6B7E94] mb-1">Ticket Promedio</p>
            <p className="text-2xl font-bold text-[#162439]">
              {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(keyMetrics.ticketPromedio || 0)}
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border/70 bg-card">
            <p className="text-sm text-[#6B7E94] mb-1">Retención Pacientes</p>
            <p className="text-2xl font-bold text-[#162439]">{keyMetrics.retencionPacientes || 0}%</p>
          </div>
          <div className="p-4 rounded-xl border border-border/70 bg-card">
            <p className="text-sm text-[#6B7E94] mb-1">No-Show Rate</p>
            <p className="text-2xl font-bold text-red-600">{keyMetrics.noShowRate || 0}%</p>
          </div>
          <div className="p-4 rounded-xl border border-green-200 bg-card">
            <p className="text-sm text-[#6B7E94] mb-1">Ingresos Hoy</p>
            <p className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(keyMetrics.revenueToday || 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
