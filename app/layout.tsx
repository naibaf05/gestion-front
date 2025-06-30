import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/AuthContext"
import { ConfigProvider } from "@/contexts/ConfigContext"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sistema de Trazabilidad - Residuos",
  description: "Sistema integral de gestión de clientes, empleados y parametrizaciones",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ConfigProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ConfigProvider>
      </body>
    </html>
  )
}
