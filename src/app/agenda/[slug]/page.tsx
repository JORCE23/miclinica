"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { format, addDays, startOfToday } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { RutInput } from "@/components/shared/RutInput"
import { Loader2, CalendarDays, CheckCircle2, ArrowRight, User } from "lucide-react"

export default function PublicBookingPage({ params }: { params: { slug: string } }) {
  const [step, setStep] = useState(1)
  
  // Selections
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(startOfToday())
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  
  // Patient details
  const [rut, setRut] = useState("")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")

  const { data: clinic, isLoading: loadingClinic } = useQuery({
    queryKey: ["public-clinic", params.slug],
    queryFn: async () => {
      const res = await fetch(`/api/public/clinics/${params.slug}`)
      if (!res.ok) throw new Error("Clínica no encontrada")
      return res.json()
    }
  })

  const { data: services, isLoading: loadingServices } = useQuery({
    queryKey: ["public-services", params.slug],
    queryFn: async () => {
      const res = await fetch(`/api/public/clinics/${params.slug}/services`)
      if (!res.ok) throw new Error("Error cargando servicios")
      return res.json()
    }
  })

  const { data: availability, isLoading: loadingAvailability } = useQuery({
    queryKey: ["public-availability", params.slug, selectedDate?.toISOString(), selectedService?.id],
    queryFn: async () => {
      if (!selectedDate || !selectedService) return { slots: [] }
      const res = await fetch(`/api/public/clinics/${params.slug}/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          date: selectedDate.toISOString(), 
          duration_minutes: selectedService.duration_minutes 
        })
      })
      if (!res.ok) throw new Error("Error cargando disponibilidad")
      return res.json()
    },
    enabled: !!selectedDate && !!selectedService && step === 2
  })

  const bookMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/public/clinics/${params.slug}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: selectedService.id,
          scheduled_at: selectedTime,
          rut,
          full_name: fullName,
          email,
          phone
        })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Error al agendar")
      }
      return res.json()
    },
    onSuccess: () => {
      setStep(4)
    }
  })

  if (loadingClinic) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  if (!clinic) {
    return <div className="min-h-screen flex items-center justify-center text-xl text-muted-foreground">Clínica no encontrada</div>
  }

  const isWeekend = (date: Date) => {
    const day = date.getDay()
    return day === 0 || day === 6 // 0 is Sunday, 6 is Saturday
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Agenda Online
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {clinic.name}
          </p>
        </div>

        <Card className="border-0 shadow-lg ring-1 ring-black/5">
          {step === 1 && (
            <>
              <CardHeader className="bg-primary/5 rounded-t-xl border-b pb-6">
                <CardTitle className="text-xl flex items-center"><ArrowRight className="mr-2 h-5 w-5 text-primary"/> Selecciona tu Tratamiento</CardTitle>
                <CardDescription>Elige el servicio que deseas agendar</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {loadingServices ? (
                  <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : (
                  <div className="grid gap-4">
                    {services?.map((service: any) => (
                      <div 
                        key={service.id}
                        onClick={() => {
                          setSelectedService(service)
                          setStep(2)
                        }}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl hover:border-primary hover:bg-primary/5 cursor-pointer transition-all"
                      >
                        <div>
                          <h4 className="font-semibold text-lg text-slate-800 group-hover:text-primary transition-colors">{service.name}</h4>
                          <p className="text-sm text-slate-500">{service.duration_minutes} minutos</p>
                        </div>
                        <div className="mt-2 sm:mt-0 font-medium text-slate-900 bg-slate-100 px-3 py-1 rounded-full text-sm">
                          {service.price ? `$${service.price.toLocaleString()}` : 'Precio variable'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader className="bg-primary/5 rounded-t-xl border-b pb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl flex items-center"><CalendarDays className="mr-2 h-5 w-5 text-primary"/> Fecha y Hora</CardTitle>
                    <CardDescription>{selectedService?.name}</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setStep(1)}>Cambiar</Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-medium mb-4 text-slate-700">1. Selecciona el día</h4>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date)
                          setSelectedTime(null)
                        }
                      }}
                      locale={es}
                      disabled={[{ before: startOfToday() }, isWeekend]}
                      className="rounded-md border shadow-sm p-3"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium mb-4 text-slate-700">2. Horas disponibles</h4>
                    {loadingAvailability ? (
                      <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                    ) : availability?.slots?.length === 0 ? (
                      <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-slate-500">No hay horas disponibles este día.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 pb-2">
                        {availability?.slots?.map((slotIso: string) => {
                          const slotDate = new Date(slotIso)
                          const timeString = format(slotDate, "HH:mm")
                          const isSelected = selectedTime === slotIso
                          
                          return (
                            <Button
                              key={slotIso}
                              variant={isSelected ? "default" : "outline"}
                              className={`w-full ${isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:border-primary'}`}
                              onClick={() => setSelectedTime(slotIso)}
                            >
                              {timeString}
                            </Button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-8 flex justify-end">
                  <Button 
                    onClick={() => setStep(3)} 
                    disabled={!selectedTime}
                    className="w-full sm:w-auto px-8"
                  >
                    Continuar <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader className="bg-primary/5 rounded-t-xl border-b pb-6">
                 <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl flex items-center"><User className="mr-2 h-5 w-5 text-primary"/> Tus Datos</CardTitle>
                    <CardDescription>Ingresa tus datos para confirmar la reserva</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setStep(2)}>Volver</Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); bookMutation.mutate(); }}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">RUT</label>
                    <RutInput value={rut} onChange={setRut} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Nombre Completo</label>
                    <Input required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Ej: María Pérez" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Email (Opcional)</label>
                      <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@ejemplo.com" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Teléfono (Opcional)</label>
                      <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+56 9 1234 5678" />
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-xl border mt-6">
                    <h4 className="font-semibold text-slate-800 mb-2">Resumen de Cita</h4>
                    <ul className="text-sm space-y-1 text-slate-600">
                      <li><strong>Tratamiento:</strong> {selectedService?.name}</li>
                      <li><strong>Fecha:</strong> {selectedTime && format(new Date(selectedTime), "EEEE dd 'de' MMMM, yyyy", { locale: es })}</li>
                      <li><strong>Hora:</strong> {selectedTime && format(new Date(selectedTime), "HH:mm")} hrs</li>
                      <li><strong>Lugar:</strong> {clinic.name} ({clinic.address})</li>
                    </ul>
                  </div>

                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      className="w-full text-lg py-6"
                      disabled={bookMutation.isPending || rut.length < 8 || !fullName}
                    >
                      {bookMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirmar Reserva"}
                    </Button>
                    {bookMutation.isError && (
                      <p className="text-red-500 text-sm mt-2 text-center">{bookMutation.error.message}</p>
                    )}
                  </div>
                </form>
              </CardContent>
            </>
          )}

          {step === 4 && (
            <CardContent className="p-12 text-center flex flex-col items-center">
              <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Reserva Confirmada!</h2>
              <p className="text-slate-600 max-w-md mx-auto mb-8">
                Tu cita para <strong>{selectedService?.name}</strong> ha sido agendada exitosamente para el <strong>{selectedTime && format(new Date(selectedTime), "dd/MM/yyyy 'a las' HH:mm")}</strong>.
              </p>
              <Button onClick={() => window.location.reload()} variant="outline" className="px-8">
                Agendar otra cita
              </Button>
            </CardContent>
          )}

        </Card>
      </div>
    </div>
  )
}
