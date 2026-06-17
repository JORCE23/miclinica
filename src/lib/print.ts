/**
 * Imprime únicamente el contenedor marcado con la clase `print-area`.
 * Activa la clase `printing-active` en <body> (ver reglas @media print en globals.css),
 * dispara el diálogo de impresión y limpia el estado al terminar.
 */
export function printArea() {
  if (typeof window === "undefined") return

  const cleanup = () => {
    document.body.classList.remove("printing-active")
    window.removeEventListener("afterprint", cleanup)
  }

  document.body.classList.add("printing-active")
  window.addEventListener("afterprint", cleanup)

  // Pequeño delay para asegurar que la clase aplique antes de imprimir
  window.setTimeout(() => {
    window.print()
    // Fallback por si afterprint no dispara en algunos navegadores
    window.setTimeout(cleanup, 1000)
  }, 50)
}
