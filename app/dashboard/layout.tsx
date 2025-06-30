import type React from "react"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Sidebar } from "@/components/Sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto md:ml-0">
          <div className="p-6 md:p-8 pt-16 md:pt-8">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
