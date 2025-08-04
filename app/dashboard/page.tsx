"use client"

import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Building2, MapPin, Settings, LogOut } from "lucide-react"

export default function DashboardPage() {
  const { user, logout } = useAuth()

  const stats = [
    {
      title: "Empleados",
      value: "24",
      description: "Empleados activos",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Clientes",
      value: "156",
      description: "Clientes registrados",
      icon: Building2,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Sedes",
      value: "89",
      description: "Sedes activas",
      icon: MapPin,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Parametrizaciones",
      value: "12",
      description: "Listas configuradas",
      icon: Settings,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bienvenido, {user?.username}</h1>
          <p className="text-gray-600">Panel de control del sistema de Trazabilidad</p>
        </div>
        <Button
          variant="outline"
          onClick={logout}
          className="new-text-red-600 hover:new-text-red-700 hover:new-bg-red-50 bg-transparent"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimas acciones realizadas en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Nuevo cliente registrado</p>
                  <p className="text-xs text-gray-500">Hace 2 horas</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Empleado actualizado</p>
                  <p className="text-xs text-gray-500">Hace 4 horas</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Nueva sede creada</p>
                  <p className="text-xs text-gray-500">Hace 6 horas</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accesos Rápidos</CardTitle>
            <CardDescription>Funciones más utilizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                <Users className="h-6 w-6 text-blue-600 mb-2" />
                <p className="font-medium">Nuevo Empleado</p>
                <p className="text-xs text-gray-500">Registrar empleado</p>
              </button>
              <button className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                <Building2 className="h-6 w-6 text-green-600 mb-2" />
                <p className="font-medium">Nuevo Cliente</p>
                <p className="text-xs text-gray-500">Registrar cliente</p>
              </button>
              <button className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                <MapPin className="h-6 w-6 text-purple-600 mb-2" />
                <p className="font-medium">Nueva Sede</p>
                <p className="text-xs text-gray-500">Crear sede</p>
              </button>
              <button className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                <Settings className="h-6 w-6 text-orange-600 mb-2" />
                <p className="font-medium">Configuración</p>
                <p className="text-xs text-gray-500">Ajustes del sistema</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
