"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, MapPin, MapPinOff, PowerSquare } from "lucide-react"
import { parametrizationService } from "@/services/parametrizationService"
import type { Parametrizacion } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { ParametrizationDialog } from "@/components/dialogs/ParametrizationDialog"
import type { ColumnDef } from "@tanstack/react-table"
import { LocationPickerDialog } from "@/components/dialogs/LocationPickerDialog"

type ParametrizationType = "poblados" | "oficinas" | "generadores" | "periodos" | "comerciales"

export default function ParametrizationsPage() {
  const [poblados, setPoblados] = useState<Parametrizacion[]>([])
  const [oficinas, setOficinas] = useState<Parametrizacion[]>([])
  const [generadores, setGeneradores] = useState<Parametrizacion[]>([])
  const [periodos, setPeriodos] = useState<Parametrizacion[]>([])
  const [comerciales, setComerciales] = useState<Parametrizacion[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [currentType, setCurrentType] = useState<ParametrizationType>("poblados")
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [pobladosData, oficinasData, generadoresData, periodosData, comercialesData] =
        await Promise.all([
          parametrizationService.getLista("poblado"),
          parametrizationService.getLista("oficina"),
          parametrizationService.getLista("generador"),
          parametrizationService.getLista("periodo"),
          parametrizationService.getLista("comercial"),
        ])
      setPoblados(pobladosData)
      setOficinas(oficinasData)
      setGeneradores(generadoresData)
      setPeriodos(periodosData)
      setComerciales(comercialesData)
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
              className={item.activo ? "text-red-600" : "text-green-600"}
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Parametrizaciones</h1>
        <p className="text-gray-600">Gestiona las listas parametrizables del sistema</p>
      </div>

      <Tabs defaultValue="poblados" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="poblados">Municipios</TabsTrigger>
          <TabsTrigger value="oficinas">Plantas</TabsTrigger>
          <TabsTrigger value="generadores">Generadores</TabsTrigger>
          <TabsTrigger value="periodos">Periodos</TabsTrigger>
          <TabsTrigger value="comerciales">Comerciales</TabsTrigger>
        </TabsList>

        <TabsContent value="poblados">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Municipios</CardTitle>
                <CardDescription>Gestiona los municipios disponibles</CardDescription>
              </div>
              <Button onClick={() => handleCreate("poblados")} className="bg-primary hover:bg-primary-hover">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Poblado
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={createColumns("poblados")}
                data={poblados}
                searchKey="nombre"
                searchPlaceholder="Buscar municipio..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="oficinas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Plantas</CardTitle>
                <CardDescription>Gestiona las plantas disponibles</CardDescription>
              </div>
              <Button onClick={() => handleCreate("oficinas")} className="bg-primary hover:bg-primary-hover">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Planta
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={createColumns("oficinas")}
                data={oficinas}
                searchKey="nombre"
                searchPlaceholder="Buscar planta..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generadores">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Generadores</CardTitle>
                <CardDescription>Gestiona los tipos de generadores</CardDescription>
              </div>
              <Button onClick={() => handleCreate("generadores")} className="bg-primary hover:bg-primary-hover">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Generador
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={createColumns("generadores")}
                data={generadores}
                searchKey="nombre"
                searchPlaceholder="Buscar generador..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="periodos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Periodos</CardTitle>
                <CardDescription>Gestiona los periodos de recolección</CardDescription>
              </div>
              <Button onClick={() => handleCreate("periodos")} className="bg-primary hover:bg-primary-hover">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Periodo
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={createColumns("periodos")}
                data={periodos}
                searchKey="nombre"
                searchPlaceholder="Buscar periodo..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comerciales">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Comerciales</CardTitle>
                <CardDescription>Gestiona los empleados asignados como comerciales</CardDescription>
              </div>
              <Button onClick={() => handleCreate("comerciales")} className="bg-primary hover:bg-primary-hover">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Comercial
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={createColumns("comerciales")}
                data={comerciales}
                searchKey="nombre"
                searchPlaceholder="Buscar comercial..."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ParametrizationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={selectedItem}
        type={currentType as Exclude<ParametrizationType, "comerciales">}
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