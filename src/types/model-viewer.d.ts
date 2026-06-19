import type { DetailedHTMLProps, HTMLAttributes } from "react"

// Permite usar el web component <model-viewer> de Google dentro de JSX/TSX.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & Record<string, unknown>,
        HTMLElement
      >
    }
  }
}

export {}
