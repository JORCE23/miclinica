"use client"

import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { Button } from "@/components/ui/button"
import { Download, Calendar as CalendarIcon, Filter } from "lucide-react"

const monthlyRevenue = [
  { name: 'Ene', ingresos: 4500000 },
  { name: 'Feb', ingresos: 5200000 },
  { name: 'Mar', ingresos: 4800000 },
  { name: 'Abr', ingresos: 6100000 },
  { name: 'May', ingresos: 5900000 },
  { name: 'Jun', ingresos: 7200000 },
]

const servicesData = [
  { name: 'Botox', citas: 145 },
  { name: 'Ácido Hialurónico', citas: 120 },
  { name: 'Limpieza Facial', citas: 98 },
  { name: 'Peeling', citas: 75 },
  { name: 'Láser', citas: 60 },
]

export function ReportsView() {
  const [dateRange, setDateRange] = useState("Este Año")

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-xl border border-[#D8E2ED] shadow-sm">
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
          <Button variant="outline" className="border-[#D8E2ED] text-[#162439]">
            <Filter className="w-4 h-4 mr-2" /> Filtros
          </Button>
          <Button className="bg-[#162439] hover:bg-[#1E304D] text-white">
            <Download className="w-4 h-4 mr-2" /> Exportar CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-[#D8E2ED] shadow-sm">
          <h2 className="text-lg font-semibold text-[#162439] mb-6">Evolución de Ingresos</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7E94', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7E94', fontSize: 12}} dx={-10} tickFormatter={(value) => `$${value/1000000}M`} />
                <RechartsTooltip 
                  cursor={{stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Ingresos']}
                />
                <Line type="monotone" dataKey="ingresos" stroke="#162439" strokeWidth={3} dot={{r: 4, fill: '#162439'}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#D8E2ED] shadow-sm">
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
                  formatter={(value: number) => [`${value} citas`, 'Frecuencia']}
                />
                <Bar dataKey="citas" fill="#7B9AB5" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-[#D8E2ED] shadow-sm">
        <h2 className="text-lg font-semibold text-[#162439] mb-4">Métricas Clave</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-[#F0F3F7] rounded-lg">
            <p className="text-sm text-[#6B7E94] mb-1">Ticket Promedio</p>
            <p className="text-2xl font-bold text-[#162439]">$85.000</p>
          </div>
          <div className="p-4 bg-[#F0F3F7] rounded-lg">
            <p className="text-sm text-[#6B7E94] mb-1">Retención Pacientes</p>
            <p className="text-2xl font-bold text-[#162439]">68%</p>
          </div>
          <div className="p-4 bg-[#F0F3F7] rounded-lg">
            <p className="text-sm text-[#6B7E94] mb-1">No-Show Rate</p>
            <p className="text-2xl font-bold text-red-600">12%</p>
          </div>
          <div className="p-4 bg-[#F0F3F7] rounded-lg">
            <p className="text-sm text-[#6B7E94] mb-1">Costo Adquisición (CAC)</p>
            <p className="text-2xl font-bold text-[#162439]">$15.000</p>
          </div>
        </div>
      </div>
    </div>
  )
}
