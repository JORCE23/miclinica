"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { validateRut, formatRut } from "@/lib/validations/rut"
import { CheckCircle2, XCircle } from "lucide-react"

interface RutInputProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
}

export function RutInput({ value, onChange, onBlur, error }: RutInputProps) {
  const [isDirty, setIsDirty] = useState(false)
  const isValid = isDirty && value.length > 3 && validateRut(value)
  const isInvalid = isDirty && value.length > 3 && !validateRut(value)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRut(e.target.value)
    onChange(formatted)
    setIsDirty(true)
  }

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder="12.345.678-9"
        maxLength={12}
        className={isInvalid ? "border-red-500 pr-10" : isValid ? "border-green-500 pr-10" : "pr-10"}
      />
      {isValid   && <CheckCircle2 className="absolute right-3 top-2.5 h-4 w-4 text-green-500" />}
      {isInvalid && <XCircle      className="absolute right-3 top-2.5 h-4 w-4 text-red-500" />}
      {error     && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
