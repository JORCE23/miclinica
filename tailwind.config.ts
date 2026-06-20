import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        /* ── Marfil Clínico ── (paleta de marca; antes azul/navy) */
        navy: {            // "oscuro" de marca → casi negro cálido / slate profundo
          DEFAULT: '#1A1A14',
          light: '#2A2A22',
          muted: '#54707F',
        },
        steel: {           // → plateado neutro
          DEFAULT: '#8A929B',
          light: '#AEB6BF',
          muted: '#C4CACF',
        },
        brand: {           // acento de marca → SLATE
          DEFAULT: '#54707F',
          light: '#6E8A98',
          dark: '#3F5663',
          soft: '#E7ECEE',
        },
        silver: '#8A929B',
        success: '#4E8A72',
        warning: '#CAA86A',
        danger: '#C0563F',
        'ms-bg': '#F5F2EC',
        'ms-surface': '#FFFFFF',
        'ms-border': '#E6E1D7',
        'ms-text': '#1A1A14',
        'ms-muted': '#5C5A50',
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        // Marfil Clínico: Marcellus para títulos/display, Cormorant para itálico de énfasis, Jost para UI
        serif: ['var(--font-marcellus)', 'Georgia', 'serif'],
        display: ['var(--font-marcellus)', 'Georgia', 'serif'],
        cormorant: ['var(--font-cormorant)', 'Georgia', 'serif'],
        sans: ['var(--font-jost)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        soft: "0 1px 2px rgb(16 36 57 / 0.04), 0 4px 16px -4px rgb(16 36 57 / 0.08)",
        card: "0 1px 3px rgb(16 36 57 / 0.05), 0 8px 24px -8px rgb(16 36 57 / 0.10)",
        elevated: "0 2px 4px rgb(16 36 57 / 0.04), 0 12px 32px -8px rgb(16 36 57 / 0.14)",
        glow: "0 0 0 1px rgb(46 127 176 / 0.10), 0 8px 24px -6px rgb(46 127 176 / 0.22)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config