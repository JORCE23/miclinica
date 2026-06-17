"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { serviceSchema, type ServiceFormValues } from "@/lib/validations/service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Service } from "@/types"
import { Switch } from "@/components/ui/switch"

interface ServiceFormProps {
  initialData?: Service
  onSubmit: (data: ServiceFormValues) => void
  isSubmitting?: boolean
}

export function ServiceForm({ initialData, onSubmit, isSubmitting }: ServiceFormProps) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      category: initialData?.category || "",
      duration_minutes: initialData?.duration_minutes || 60,
      price: initialData?.price || 0,
      loyalty_points_earned: initialData?.loyalty_points_earned || 0,
      is_active: initialData?.is_active ?? true,
    },
  })

  const isActive = watch("is_active")

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2 sm:col-span-1">
          <Label htmlFor="name">Nombre del Servicio *</Label>
          <Input id="name" placeholder="Ej. Bótox Facial" {...register("name")} />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>
        
        <div className="space-y-2 col-span-2 sm:col-span-1">
          <Label htmlFor="category">Categoría</Label>
          <Input id="category" placeholder="Ej. Toxina Botulínica" {...register("category")} />
          {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea 
          id="description" 
          placeholder="Detalles del procedimiento..." 
          {...register("description")} 
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration_minutes">Duración (minutos) *</Label>
          <Input 
            id="duration_minutes" 
            type="number" 
            min="5" 
            step="5"
            {...register("duration_minutes")} 
          />
          {errors.duration_minutes && <p className="text-sm text-red-500">{errors.duration_minutes.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Precio ($)</Label>
          <Input 
            id="price" 
            type="number" 
            min="0"
            {...register("price")} 
          />
          {errors.price && <p className="text-sm text-red-500">{errors.price.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="loyalty_points_earned">Puntos de Fidelidad que Otorga</Label>
        <Input 
          id="loyalty_points_earned" 
          type="number" 
          min="0"
          {...register("loyalty_points_earned")} 
        />
        {errors.loyalty_points_earned && <p className="text-sm text-red-500">{errors.loyalty_points_earned.message}</p>}
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Switch 
          id="is_active" 
          checked={isActive} 
          onCheckedChange={(checked) => setValue("is_active", checked)}
        />
        <Label htmlFor="is_active">Servicio Activo</Label>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSubmitting} className="bg-[#162439] hover:bg-[#1E304D] text-white">
          {isSubmitting ? "Guardando..." : initialData ? "Actualizar Servicio" : "Crear Servicio"}
        </Button>
      </div>
    </form>
  )
}

