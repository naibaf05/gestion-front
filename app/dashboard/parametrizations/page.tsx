"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, MapPin, MapPinOff, PowerSquare, Building, Zap, Clock, UserCheck, Settings, Search, LocateFixed, Biohazard } from "lucide-react"
import { parametrizationService } from "@/services/parametrizationService"
import type { Parametrizacion } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { ParametrizationDialog } from "@/components/dialogs/ParametrizationDialog"
import type { ColumnDef } from "@tanstack/react-table"
import { LocationPickerDialog } from "@/components/dialogs/LocationPickerDialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

type ParametrizationType = "poblados" | "oficinas" | "generadores" | "periodos" | "comerciales" | "t_residuos"

interface ParametrizationConfig {
  key: ParametrizationType
  title: string
  singular_title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
}

const parametrizationConfigs: ParametrizationConfig[] = [
  {
    key: "poblados",
    title: "Municipios",
    singular_title: "Municipio",
    description: "Administra los municipios disponibles",
    icon: LocateFixed,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    key: "oficinas",
    title: "Plantas",
    singular_title: "Planta",
    description: "Administra las plantas disponibles",
    icon: Building,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    key: "generadores",
    title: "Generadores",
    singular_title: "Generador",
    description: "Administra los tipos de generadores de residuos disponibles",
    icon: Zap,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
  {
    key: "periodos",
    title: "Periodos",
    singular_title: "Periodo",
    description: "Administra los periodos de recolección disponibles",
    icon: Clock,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    key: "comerciales",
    title: "Comerciales",
    singular_title: "Comercial",
    description: "Administra los representantes comerciales disponibles",
    icon: UserCheck,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
  {
    key: "t_residuos",
    title: "Tipos de Residuos",
    singular_title: "Tipo de Residuo",
    description: "Administra los tipos de residuos disponibles",
    icon: Biohazard,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
]

export default function ParametrizationsPage() {
  const [selectedType, setSelectedType] = useState<ParametrizationType>("poblados")
  const [searchTerm, setSearchTerm] = useState("")
  const [poblados, setPoblados] = useState<Parametrizacion[]>([])
  const [oficinas, setOficinas] = useState<Parametrizacion[]>([])
  const [generadores, setGeneradores] = useState<Parametrizacion[]>([])
  const [periodos, setPeriodos] = useState<Parametrizacion[]>([])
  const [comerciales, setComerciales] = useState<Parametrizacion[]>([])
  const [t_residuos, setTResiduos] = useState<Parametrizacion[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [currentType, setCurrentType] = useState<ParametrizationType>("poblados")
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    setSearchTerm("")
  }, [selectedType])

  const loadData = async () => {
    try {
      setLoading(true)
      const [pobladosData, oficinasData, generadoresData, periodosData, comercialesData, tResiduoData] =
        await Promise.all([
          parametrizationService.getLista("poblado"),
          parametrizationService.getLista("oficina"),
          parametrizationService.getLista("generador"),
          parametrizationService.getLista("periodo"),
          parametrizationService.getLista("comercial"),
          parametrizationService.getLista("t_residuo"),
        ])
      setPoblados(pobladosData)
      setOficinas(oficinasData)
      setGeneradores(generadoresData)
      setPeriodos(periodosData)
      setComerciales(comercialesData)
      setTResiduos(tResiduoData)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getCurrentData = () => {
    switch (selectedType) {
      case "poblados":
        return poblados
      case "oficinas":
        return oficinas
      case "generadores":
        return generadores
      case "periodos":
        return periodos
      case "comerciales":
        return comerciales
      case "t_residuos":
        return t_residuos
      default:
        return []
    }
  }

  const getLengthData = (config: ParametrizationConfig) => {
    switch (config.key) {
      case "poblados":
        return poblados.length
      case "oficinas":
        return oficinas.length
      case "generadores":
        return generadores.length
      case "periodos":
        return periodos.length
      case "comerciales":
        return comerciales.length
      case "t_residuos":
        return t_residuos.length
      default:
        return 0
    }
  }

  const getFilteredData = () => {
    const data = getCurrentData()
    if (!searchTerm) return data

    return data.filter((item: any) => {
      return (
        item.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
  }

  const getCurrentConfig = () => {
    return parametrizationConfigs.find((config) => config.key === selectedType)!
  }

  const handleCreate = (type: ParametrizationType) => {
    setCurrentType(type)
    setSelectedItem(null)
    setDialogOpen(true)
  }

  const handleEdit = (item: any, type: ParametrizationType) => {
    setCurrentType(type)
    setSelectedItem(item)
    setDialogOpen(true)
  }

  const handleToggleStatus = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas cambiar el estado a este elemento?")) {
      try {
        await parametrizationService.toggleStatus(id)
        toast({
          title: "Elemento eliminado",
          description: "El elemento ha sido eliminado exitosamente",
        })
        loadData()
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo eliminar el elemento",
          variant: "destructive",
        })
      }
    }
  }

  const openLocationPicker = (item: any, type: ParametrizationType) => {
    setCurrentType(type)
    setSelectedItem(item)
    setLocationDialogOpen(true);
  };

  const handleLocationConfirm = (
    lat: number,
    lng: number,
    address?: string
  ) => {
    let item = selectedItem;
    if (item) {
      let datos = {
        lat: lat,
        lon: lng
      }
      item.datosJson = JSON.stringify(datos);
      setSelectedItem(item);
      parametrizationService.updateDatosJson(item.id, item);
    }
    toast({
      title: "Ubicación seleccionada",
      description: "La ubicación ha sido establecida correctamente",
    });
  };

  const createColumns = (type: ParametrizationType): ColumnDef<any>[] => {
    const baseColumns: ColumnDef<any>[] = [
      {
        accessorKey: "codigo",
        header: "Codigo",
      },
      {
        accessorKey: "nombre",
        header: "Nombre",
      },
      {
        accessorKey: "descripcion",
        header: "Descripción",
      },
    ]

    // Columna de estado
    baseColumns.push({
      accessorKey: "activo",
      header: "Estado",
      cell: ({ row }) => {
        return (
          <Badge variant={row.getValue("activo") ? "default" : "secondary"}>
            {row.getValue("activo") ? "Activo" : "Inactivo"}
          </Badge>
        )
      },
    })

    // Columna de acciones
    baseColumns.push({
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => handleEdit(item, type)}>
              <Edit className="h-4 w-4" />
            </Button>
            {type === 'oficinas' ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openLocationPicker(item, type)}
                className={item.datosJson?.lat ? "text-green-600" : "text-red-600"}
              >
                {item.datosJson?.lat ? (
                  <MapPin className="h-4 w-4" />
                ) : (
                  <MapPinOff className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <div></div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleStatus(item.id)}
              className={item.activo ? "text-green-600" : "text-red-600"}
            >
              <PowerSquare className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    })

    return baseColumns
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando parametrizaciones...</p>
        </div>
      </div>
    )
  }

  const currentConfig = getCurrentConfig()
  const filteredData = getFilteredData()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Parametrizaciones
          </h1>
          <p className="text-gray-600">Gestiona las configuraciones del sistema</p>
        </div>
      </div>

      {/* Selector y Controles */}
      <Card>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            {/* Selector Principal */}
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-gray-700">Tipo de Parametrización</label>
              <Select value={selectedType} onValueChange={(value: ParametrizationType) => setSelectedType(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una parametrización" />
                </SelectTrigger>
                <SelectContent>
                  {parametrizationConfigs.map((config) => (
                    <SelectItem key={config.key} value={config.key}>
                      <div className="flex items-center gap-2">
                        <config.icon className={`h-4 w-4 ${config.color}`} />
                        <span>{config.title}</span>
                        <Badge variant="outline" className="ml-auto">
                          {getLengthData(config)}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Búsqueda */}
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-gray-700">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Buscar ${currentConfig.title.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Botón Crear */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 opacity-0">Acción</label>
              <Button onClick={() => handleCreate(selectedType)} className="bg-primary hover:bg-primary-hover">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo {currentConfig.singular_title}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Datos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <currentConfig.icon className={`h-5 w-5 ${currentConfig.color}`} />
            {currentConfig.title}
          </CardTitle>
          <CardDescription>{currentConfig.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={createColumns(selectedType)} data={filteredData} searchKey="" searchPlaceholder="" />
        </CardContent>
      </Card>

      <ParametrizationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={selectedItem}
        type={currentType}
        onSuccess={loadData}
      />

      <LocationPickerDialog
        open={locationDialogOpen}
        onOpenChange={setLocationDialogOpen}
        title="Seleccionar Ubicación de la Sede"
        description="Busca la dirección o haz clic en el mapa para establecer la ubicación exacta de la sede"
        initialLat={selectedItem?.datosJson?.lat}
        initialLng={selectedItem?.datosJson?.lon}
        onLocationConfirm={handleLocationConfirm}
      />
    </div>
  )
}