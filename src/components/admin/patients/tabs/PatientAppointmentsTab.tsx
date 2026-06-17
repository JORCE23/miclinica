"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter, Eye, List, CheckCircle2, XCircle, Clock } from "lucide-react"
import Link from "next/link"
import { format, isToday, isFuture, isPast, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function PatientAppointmentsTab({ patientId }: { patientId: string }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isExtended, setIsExtended] = useState(false)
  const [statusFilter, setStatusFilter] = useState("todos")

  const { data: rawAppointments = [], isLoading } = useQuery({
    queryKey: ["appointments", patientId],
    queryFn: async () => {
      const response = await fetch(`/api/appointments?patientId=${patientId}`)
      if (!response.ok) throw new Error("Error al cargar citas")
      return response.json()
    }
  })

  if (isLoading) return <div className="p-8 text-center text-slate-500">Cargando historial de atenciones...</div>

  const appointments = rawAppointments.filter((a: any) => {
    let matchesSearch = true
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const serviceMatch = a.service?.name?.toLowerCase().includes(searchLower)
      const profMatch = a.created_by_profile?.full_name?.toLowerCase().includes(searchLower)
      const statusMatch = a.status?.toLowerCase().includes(searchLower)
      matchesSearch = serviceMatch || profMatch || statusMatch
    }
    let matchesStatus = true
    if (statusFilter !== "todos") {
      matchesStatus = a.status === statusFilter
    }
    return matchesSearch && matchesStatus
  })

  const todayAppointments = appointments.filter((a: any) => isToday(parseISO(a.scheduled_at)))
  const futureAppointments = appointments.filter((a: any) => isFuture(parseISO(a.scheduled_at)) && !isToday(parseISO(a.scheduled_at)))
  const pastAppointments = appointments.filter((a: any) => isPast(parseISO(a.scheduled_at)) && !isToday(parseISO(a.scheduled_at)))

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completada': return <CheckCircle2 className="w-12 h-12 text-emerald-500 bg-emerald-50 rounded-full p-1 border-4 border-emerald-100" />
      case 'confirmada': return <CheckCircle2 className="w-12 h-12 text-blue-500 bg-blue-50 rounded-full p-1 border-4 border-blue-100" />
      case 'cancelada': return <XCircle className="w-12 h-12 text-red-500 bg-red-50 rounded-full p-1 border-4 border-red-100" />
      case 'no_asistio': return <XCircle className="w-12 h-12 text-amber-500 bg-amber-50 rounded-full p-1 border-4 border-amber-100" />
      default: return <Clock className="w-12 h-12 text-slate-400 bg-slate-50 rounded-full p-2 border-4 border-slate-100" />
    }
  }

  const AppointmentCard = ({ appointment }: { appointment: any }) => {
    const dateObj = parseISO(appointment.scheduled_at)
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border border-border/70 rounded-2xl bg-white shadow-soft hover:shadow-card transition-shadow mb-3 relative overflow-hidden group">
        {/* Date Box */}
        <div className="bg-slate-100/80 dark:bg-slate-800 rounded-lg p-3 text-center w-full sm:w-auto sm:min-w-[120px] flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:h-full border border-slate-200 dark:border-slate-700 shrink-0">
          <div className="font-bold text-foreground dark:text-slate-200">{format(dateObj, "dd MMM yyyy", { locale: es })}</div>
          <div className="text-sm font-medium text-slate-500">{format(dateObj, "HH:mm")} hrs.</div>
        </div>

        {/* Info */}
        <div className="flex-1 w-full pl-0 sm:pl-2 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <List className="h-5 w-5 text-slate-400 shrink-0" />
              <h4 className="text-lg font-bold text-foreground dark:text-slate-100 leading-tight truncate">{appointment.service?.name || "Consulta general"}</h4>
            </div>
            {/* Status Icon Mobile */}
            <div className="sm:hidden shrink-0 scale-75 origin-right">
              {getStatusIcon(appointment.status)}
            </div>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-0.5 ml-0 sm:ml-7 mt-2 sm:mt-0">
            <p className="truncate"><span className="font-semibold">Profesional:</span> {appointment.created_by_profile?.full_name || "Sin asignar"}</p>
            <p><span className="font-semibold">Estado:</span> <span className="capitalize">{appointment.status.replace('_', ' ')}</span></p>
            {isExtended && (
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                {appointment.price !== undefined && appointment.price !== null && <p><span className="font-semibold">Precio:</span> ${Number(appointment.price).toLocaleString()}</p>}
                {appointment.duration_minutes !== undefined && appointment.duration_minutes !== null && <p><span className="font-semibold">Duración:</span> {appointment.duration_minutes} min</p>}
                {appointment.notes && <p className="italic mt-1 text-slate-500">&ldquo;{appointment.notes}&rdquo;</p>}
              </div>
            )}
          </div>
        </div>

        {/* Status Icon Large */}
        <div className="hidden sm:block pr-6 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
          {getStatusIcon(appointment.status)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-muted/40 p-2 sm:p-3 rounded-2xl border border-border/70">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
          <Button 
            variant="outline" 
            className="bg-white border-slate-200 text-slate-600 w-full sm:w-auto"
            onClick={() => { setSearchTerm(""); setStatusFilter("todos"); }}
          >
            Historial
          </Button>
          <div className="relative flex-1 w-full sm:max-w-[300px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar atención..." 
              className="pl-9 bg-white w-full" 
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant={isExtended ? "default" : "outline"} 
            className={isExtended ? "bg-slate-800 text-white" : "bg-white text-slate-600"}
            onClick={() => setIsExtended(!isExtended)}
          >
            <Eye className="mr-2 h-4 w-4" /> Extendida
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button 
                variant={statusFilter !== "todos" ? "default" : "outline"} 
                className={statusFilter !== "todos" ? "bg-slate-800 text-white" : "bg-white text-slate-600"}
              >
                <Filter className="mr-2 h-4 w-4" /> 
                {statusFilter !== "todos" ? statusFilter.replace('_', ' ') : "Filtrar"}
              </Button>
            } />
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Filtrar por estado</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilter("todos")}>Todos</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("pendiente")}>Pendiente</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("confirmada")}>Confirmada</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("completada")}>Completada</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("cancelada")}>Cancelada</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("no_asistio")}>No asistió</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button render={<Link href={`/admin/appointments/new?patientId=${patientId}`} />} className="bg-brand text-white hover:bg-brand-dark shadow-glow rounded-xl border-0">
              <Plus className="mr-1 h-4 w-4" /> Nuevo
          </Button>
        </div>
      </div>

      <Accordion defaultValue={["hoy", "proximas", "pasadas"]} className="space-y-4">
        
        <AccordionItem value="proximas" className="border-none">
          <AccordionTrigger className="text-slate-500 hover:text-slate-700 py-2 font-bold text-sm tracking-wider uppercase">
            {futureAppointments.length} PRÓXIMAS ATENCIONES
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            {futureAppointments.length > 0 ? (
              futureAppointments.map((a: any) => <AppointmentCard key={a.id} appointment={a} />)
            ) : (
              <div className="p-4 text-center border-2 border-dashed rounded-xl text-slate-400">No hay atenciones futuras agendadas.</div>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="hoy" className="border-none">
          <AccordionTrigger className="text-cyan-600 hover:text-cyan-700 py-2 font-bold text-sm tracking-wider uppercase">
            {todayAppointments.length} ATENCIONES HOY
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            {todayAppointments.length > 0 ? (
              todayAppointments.map((a: any) => <AppointmentCard key={a.id} appointment={a} />)
            ) : (
              <div className="p-4 text-center border-2 border-dashed rounded-xl text-slate-400 bg-slate-50/50">No hay atenciones programadas para hoy.</div>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="pasadas" className="border-none">
          <AccordionTrigger className="text-slate-400 hover:text-slate-600 py-2 font-bold text-sm tracking-wider uppercase">
            {pastAppointments.length} ATENCIONES PASADAS
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            {pastAppointments.length > 0 ? (
              pastAppointments.map((a: any) => <AppointmentCard key={a.id} appointment={a} />)
            ) : (
              <div className="p-4 text-center border-2 border-dashed rounded-xl text-slate-400">No hay atenciones pasadas.</div>
            )}
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </div>
  )
}
