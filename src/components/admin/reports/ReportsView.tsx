"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from "recharts"
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
              <LineChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7E94', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7E94', fontSize: 12}} dx={-10} tickFormatter={(value) => `$${value/1000}k`} />
                <RechartsTooltip 
                  cursor={{stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  formatter={(value: any) => [`$${value.toLocaleString()}`, 'Ingresos']}
                />
                <Line type="monotone" dataKey="ingresos" stroke="#162439" strokeWidth={3} dot={{r: 4, fill: '#162439'}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-border/70 bg-card shadow-soft">
          <h2 className="text-lg font-semibold text-[#162439] mb-6">Servicios más populares</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={servicesData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#6B7E94', fontSize: 12}} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#162439', fontSize: 12, fontWeight: 500}} />
                <RechartsTooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  formatter={(value: any) => [`${value} citas`, 'Frecuencia']}
                />
                <Bar dataKey="citas" fill="#7B9AB5" radius={[0, 4, 4, 0]} barSize={24} />
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
