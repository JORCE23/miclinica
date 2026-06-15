import type { Metadata } from "next";
import { Jost, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"
import { QueryProvider } from "@/components/providers/QueryProvider"

const jost = Jost({
  subsets: ['latin'],
  variable: '--font-jost',
  weight: ['400', '500', '600', '700'],
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: {
    template: '%s | Medique',
    default: 'Medique — Software para Clínicas Estéticas',
  },
  description: 'Software + Marketing para Clínicas Estéticas. Gestiona pacientes, citas y fidelidad desde un solo lugar.',
  icons: {
    icon: '/logo-medique-simbolo.png',
    apple: '/logo-medique-simbolo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${jost.variable} ${cormorant.variable}`}>
      <body className="font-sans">
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
