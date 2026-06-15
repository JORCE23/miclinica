"use client"

import { useQuery } from "@tanstack/react-query"
import { Bell, Phone, Activity, Heart, Contact, Star } from "lucide-react"

export function PatientSidebar({ patient, setActiveTab, activeTab }: { patient: any, setActiveTab?: (tab: string) => void, activeTab?: string }) {
  // Fetch medical history for the pre-existencias box
  const { data: medicalHistory = [] } = useQuery({
    queryKey: ["medical-history", patient.id],
    queryFn: async () => {
      const res = await fetch(`/api/patients/${patient.id}/medical-history`)
      if (!res.ok) return []
      return res.json()
    }
  })

  // Fetch allergies
  const { data: allergies = [] } = useQuery({
    queryKey: ["allergies", patient.id],
    queryFn: async () => {
      const res = await fetch(`/api/patients/${patient.id}/allergies`)
      if (!res.ok) return []
      return res.json()
    }
  })

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return "N/A"
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return `${age} Años`
  }

  // Combinar para tabla
  const combinedHistory = [
    ...medicalHistory.map((m: any) => ({ type: "Condición", text: m.condition, date: m.diagnosed_at })),
    ...allergies.map((a: any) => ({ type: `Alergia (${a.severity})`, text: a.allergen, date: a.created_at }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

  return (
    <div className="flex h-full gap-4">
      {/* Icon Ribbon */}
      <div className="w-16 flex flex-col gap-2 bg-slate-100 dark:bg-slate-800/50 rounded-xl py-4 items-center">
        <div 
          onClick={() => setActiveTab && setActiveTab('clinical')}
          className={`p-3 rounded-lg cursor-pointer transition ${activeTab === 'clinical' ? 'bg-primary text-white shadow-sm hover:bg-primary/90' : 'text-slate-400 hover:text-primary hover:bg-primary/10'}`}
          title="Ficha Clínica"
        >
          <Activity className="h-5 w-5" />
        </div>
        <div 
          onClick={() => setActiveTab && setActiveTab('administrative')}
          className={`p-3 rounded-lg cursor-pointer transition ${activeTab === 'administrative' ? 'bg-primary text-white shadow-sm hover:bg-primary/90' : 'text-slate-400 hover:text-primary hover:bg-primary/10'}`}
          title="Datos Personales"
        >
          <Contact className="h-5 w-5" />
        </div>
        <div 
          onClick={() => setActiveTab && setActiveTab('loyalty')}
          className={`p-3 rounded-lg cursor-pointer transition ${activeTab === 'loyalty' ? 'bg-primary text-white shadow-sm hover:bg-primary/90' : 'text-slate-400 hover:text-primary hover:bg-primary/10'}`}
          title="Fidelidad"
        >
          <Star className="h-5 w-5" />
        </div>
      </div>

      {/* Info Cards */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Yellow Box (Notes) */}
        <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4">
          <div className="flex items-start gap-2 text-amber-800 dark:text-amber-300">
            <Bell className="h-4 w-4 mt-1 shrink-0" />
            <div>
              <h4 className="font-semibold text-sm mb-1">Notas Internas</h4>
              <p className="text-xs">{patient.notes || "No hay notas internas registradas para este paciente."}</p>
            </div>
          </div>
        </div>

        {/* Primary Box (Vitals / Resumen) */}
        <div className="bg-primary text-white rounded-xl p-5 shadow-sm">
          <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
            <div className="flex items-center gap-2">
              <Contact className="h-4 w-4 opacity-70" />
              <span>{calculateAge(patient.birth_date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 opacity-70" />
              <span className="truncate">{patient.phone || "Sin teléfono"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 opacity-70" />
              <span>Estado: {patient.is_active ? 'Activo' : 'Inactivo'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 opacity-70" />
              <span>Puntos Fidelidad</span>
            </div>
          </div>
        </div>

        {/* Pre-existencias (White Box) */}
        <div className="bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-sm flex-1">
          <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b font-semibold text-sm text-slate-700 dark:text-slate-200">
            Pre existencias y médicos
          </div>
          <div className="p-0">
            {combinedHistory.length > 0 ? (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 border-b">
                  <tr>
                    <th className="px-4 py-2 font-medium">Fecha/Tipo</th>
                    <th className="px-4 py-2 font-medium">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {combinedHistory.map((item: any, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 align-top text-muted-foreground whitespace-nowrap">
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                          {item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider mt-0.5">{item.type}</div>
                      </td>
                      <td className="px-4 py-3 align-top font-medium">
                        {item.text}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No hay antecedentes registrados.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
