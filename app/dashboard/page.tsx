"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useConfig } from "@/contexts/ConfigContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Building2, MapPin, Settings, LogOut, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { reportesService } from "@/services/reportesService";
import { DashboardStats, DashboardStatsResponse, MonthlySedeData, SedeInfo } from "@/types"
import { DashboardBarChart } from "@/components/ui/dashboard-bar-chart"


export default function DashboardPage() {
  const { user, logout } = useAuth()
  const { config } = useConfig()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados para el gráfico
  const [chartData, setChartData] = useState<MonthlySedeData[]>([])
  const [sedesData, setSedesData] = useState<SedeInfo[]>([])
  const [chartLoading, setChartLoading] = useState(true)
  const [chartError, setChartError] = useState<string | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<string>("empleados")



  // Configuración de iconos y colores para cada estadística
  const statsConfig = {
    empleados: {
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    clientes: {
      icon: Building2,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    sedes: {
      icon: MapPin,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    parametrizaciones: {
      icon: Settings,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  }

  // Función para cargar estadísticas
  const loadStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const dashboardStats: DashboardStatsResponse = await reportesService.getStats()
      console.log('Estadísticas del dashboard:', dashboardStats)

      // Transformar la respuesta del backend al formato esperado
      const transformedStats: DashboardStats = {
        empleados: {
          title: "Empleados",
          value: dashboardStats.empleados?.toString() || "0",
          description: "Empleados activos"
        },
        clientes: {
          title: "Clientes",
          value: dashboardStats.clientes?.toString() || "0",
          description: "Clientes registrados"
        },
        sedes: {
          title: "Sedes",
          value: dashboardStats.sedes?.toString() || "0",
          description: "Sedes activas"
        },
        parametrizaciones: {
          title: "Parametrizaciones",
          value: dashboardStats.parametrizaciones?.toString() || "0",
          description: "Listas configuradas"
        },
      }

      setStats(transformedStats)
    } catch (err) {
      console.error('Error al cargar estadísticas:', err)
      setError('Error al cargar las estadísticas del dashboard')
      // Valores por defecto en caso de error
      setStats({
        empleados: { title: "Empleados", value: "---", description: "Error al cargar" },
        clientes: { title: "Clientes", value: "---", description: "Error al cargar" },
        sedes: { title: "Sedes", value: "---", description: "Error al cargar" },
        parametrizaciones: { title: "Parametrizaciones", value: "---", description: "Error al cargar" },
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
    loadChartData()
  }, [])

  // Efecto para recargar datos del gráfico cuando cambia la métrica
  useEffect(() => {
    loadChartData()
  }, [selectedMetric])

  // Función para cargar datos del gráfico
  const loadChartData = async () => {
    try {
      setChartLoading(true)
      setChartError(null)
      const response = await reportesService.getGroupedChartDataByMetric(selectedMetric)
      setChartData(response.data)
      setSedesData(response.sedes)
    } catch (err) {
      console.error('Error al cargar datos del gráfico:', err)
      setChartError('Error al cargar los datos del gráfico')
      setChartData([])
      setSedesData([])
    } finally {
      setChartLoading(false)
    }
  }

  // Función para reintentar cargar estadísticas
  const handleRetry = () => {
    loadStats()
  }

  // Función para reintentar cargar gráfico
  const handleChartRetry = () => {
    loadChartData()
  }

  // Opciones para las métricas del gráfico
  const metricOptions = [
    { value: "empleados", label: "Empleados" },
    { value: "clientes", label: "Clientes" },
    { value: "vehiculos", label: "Vehículos" },
    { value: "certificados", label: "Certificados" }
  ]

  // Configuración del gráfico
  const chartConfig = {
    title: "Estadísticas por Sede",
    description: `Distribución de ${metricOptions.find(m => m.value === selectedMetric)?.label.toLowerCase()} por sede`,
    color: selectedMetric === "empleados" ? "#3b82f6" :
      selectedMetric === "clientes" ? "#10b981" :
        selectedMetric === "vehiculos" ? "#f59e0b" : "#8b5cf6"
  }

  // Handlers para los botones de acceso rápido
  const handleNewEmployee = () => {
    router.push('/dashboard/users?action=create')
  }

  const handleNewClient = () => {
    router.push('/dashboard/clients?action=create')
  }

  const handleNewSede = () => {
    router.push('/dashboard/sedes?action=create')
  }

  const handleConfiguration = () => {
    router.push('/dashboard/parametrizations')
  }

  const isClient = user?.rolNombre === "CLIENTE"

  return (
    <div className="space-y-6 min-h-[90vh] flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bienvenido, {user?.nombre} {user?.apellido}</h1>
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

      {!isClient && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  <div className="p-2 rounded-full bg-gray-100">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                </CardContent>
              </Card>
            ))
          ) : stats ? (
            Object.entries(stats).map(([key, stat]) => {
              const cfg = statsConfig[key as keyof typeof statsConfig]
              const IconComponent = cfg.icon
              return (
                <Card key={key}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <div className={`p-2 rounded-full ${cfg.bgColor}`}>
                      <IconComponent className={`h-4 w-4 ${cfg.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </CardContent>
                </Card>
              )
            })
          ) : null}
        </div>
      )}

      {isClient && (
        <div className="flex items-center justify-center flex-1">
          <img
            src={config?.logo || "/placeholder.svg"}
            alt={config?.companyName || "Logo"}
            className="h-56 w-auto opacity-40 select-none"
            draggable={false}
          />
        </div>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="text-red-700 border-red-300 hover:bg-red-100"
              >
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!isClient && (
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
                <button
                  onClick={handleNewEmployee}
                  className="p-4 text-left border rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors group"
                >
                  <Users className="h-6 w-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="font-medium">Nuevo Empleado</p>
                  <p className="text-xs text-gray-500">Registrar empleado</p>
                </button>
                <button
                  onClick={handleNewClient}
                  className="p-4 text-left border rounded-lg hover:bg-gray-50 hover:border-green-300 transition-colors group"
                >
                  <Building2 className="h-6 w-6 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="font-medium">Nuevo Cliente</p>
                  <p className="text-xs text-gray-500">Registrar cliente</p>
                </button>
                <button
                  onClick={handleNewSede}
                  className="p-4 text-left border rounded-lg hover:bg-gray-50 hover:border-purple-300 transition-colors group"
                >
                  <MapPin className="h-6 w-6 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="font-medium">Nueva Sede</p>
                  <p className="text-xs text-gray-500">Crear sede</p>
                </button>
                <button
                  onClick={handleConfiguration}
                  className="p-4 text-left border rounded-lg hover:bg-gray-50 hover:border-orange-300 transition-colors group"
                >
                  <Settings className="h-6 w-6 text-orange-600 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="font-medium">Configuración</p>
                  <p className="text-xs text-gray-500">Ajustes del sistema</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!isClient && (
        <div className="w-full">
          <DashboardBarChart
            data={chartData}
            sedes={sedesData}
            config={chartConfig}
            loading={chartLoading}
            error={chartError}
            onRefresh={handleChartRetry}
            metricOptions={metricOptions}
            selectedMetric={selectedMetric}
            onMetricChange={setSelectedMetric}
            height={400}
          />
        </div>
      )}
    </div>
  )
}
