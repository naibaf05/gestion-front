"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { Edit, Eye, History, Plus, Trash2 } from "lucide-react"
import { Parametrizacion, SalidaExterna, SalidaExternaCantidad, TipoResiduo } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { parametrizationService } from "@/services/parametrizationService"
import { salidaExternaService } from "@/services/salidaExternaService"
import { SalidaExternaCantidadDialog } from "./SalidaExternaCantidadDialog"
import { ButtonTooltip } from "../ui/button-tooltip"
import { TooltipProvider } from "@radix-ui/react-tooltip"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { useAuth } from "@/contexts/AuthContext"
import { HistorialDialog } from "./HistorialDialog"

interface SalidaExternaCantidadesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  salidaExterna: SalidaExterna
  gestores: Parametrizacion[]
  tiposTratamiento: Parametrizacion[]
}

export function SalidaExternaCantidadesDialog({
  open,
  onOpenChange,
  salidaExterna,
  gestores,
  tiposTratamiento,
}: SalidaExternaCantidadesDialogProps) {
  const { user } = useAuth()
  const [amounts, setAmounts] = useState<SalidaExternaCantidad[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogReadOnly, setDialogReadOnly] = useState(false)
  const [contenedores, setContenedores] = useState<Parametrizacion[]>([])
  const [tiposResiduos, setTiposResiduos] = useState<TipoResiduo[]>([])
  const [selectedAmount, setSelectedAmount] = useState<SalidaExternaCantidad | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [amountToDelete, setAmountToDelete] = useState<string | null>(null)
  const { toast } = useToast()

  const [historialOpen, setHistorialOpen] = useState(false)
  const [historialId, setHistorialId] = useState("")
  const [historialLabel, setHistorialLabel] = useState("")

  if (user && user.permisos && typeof user.permisos === "string") {
    user.permisos = JSON.parse(user.permisos)
  }

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permisos) return false
    if (user.perfil?.nombre === "ADMIN") return true
    return user.permisos[permission] === true
  }

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [salidaExterna, open])

  const handleCancel = () => {
    onOpenChange(false)
  }

  const adaptTipoResiduo = (items: Parametrizacion[]): TipoResiduo[] => {
    return items.map((p) => ({
      id: String(p.id),
      nombre: p.nombre,
      nombreMostrar: p.nombreMostrar || p.nombre,
      codigo: p.codigo,
      descripcion: p.descripcion,
      datosJson: p.datosJson,
      activo: p.activo,
      tarifa: "",
      tarifaNombre: "",
      codigoUnidad: "",
      densidad: "",
    }))
  }

  const loadData = async () => {
    try {
      setLoading(true)

      const promises: Promise<any>[] = [
        salidaExternaService.getCantidades(salidaExterna.id),
        parametrizationService.getListaActivos("contenedor"),
      ]

      const sedeReferenciaId = salidaExterna.sedeSalidaId || salidaExterna.sedeId
      if (sedeReferenciaId && salidaExterna.fecha) {
        promises.push(parametrizationService.getListaTResiduosActivos(sedeReferenciaId, salidaExterna.fecha))
      } else {
        promises.push(parametrizationService.getListaActivos("t_residuo").then(adaptTipoResiduo))
      }

      const [amountsData, contenedoresData, tiposResiduosData] = await Promise.all(promises)
      setAmounts(amountsData)
      setContenedores(contenedoresData)
      setTiposResiduos(tiposResiduosData)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las cantidades",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    if (!hasPermission("salidaexterna.edit")) return
    setSelectedAmount(null)
    setDialogReadOnly(false)
    setDialogOpen(true)
  }

  const handleEdit = (obj: SalidaExternaCantidad) => {
    if (!hasPermission("salidaexterna.edit")) return
    setSelectedAmount(obj)
    setDialogReadOnly(false)
    setDialogOpen(true)
  }

  const handleView = (obj: SalidaExternaCantidad) => {
    setSelectedAmount(obj)
    setDialogReadOnly(true)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (!hasPermission("salidaexterna.edit")) return
    setAmountToDelete(id)
    setConfirmDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!amountToDelete) return

    try {
      await salidaExternaService.deleteCantidad(amountToDelete)
      toast({
        title: "Cantidad eliminada",
        description: "La cantidad ha sido eliminada exitosamente",
        variant: "success",
      })
      loadData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la cantidad",
        variant: "destructive",
      })
    } finally {
      setAmountToDelete(null)
    }
  }

  const cancelDelete = () => {
    setAmountToDelete(null)
  }

  const handleHistorial = (item: SalidaExternaCantidad) => {
    setSelectedAmount(item)
    setHistorialId(item.id || "")
    setHistorialLabel(`Salida Externa Cantidad [${item.tResiduoNombre} - ${item.cantidadUnidad}]`)
    setHistorialOpen(true)
  }

  const columns: ColumnDef<SalidaExternaCantidad>[] = [
    {
      accessorKey: "tResiduoNombre",
      header: "Tipo de Residuo",
      width: "350px",
    },
    {
      accessorKey: "tipoTratamientoNombre",
      header: "Tipo de Tratamiento",
      width: "200px",
    },
    {
      accessorKey: "numContenedor",
      header: "Unidades",
      width: "100px",
    },
    {
      accessorKey: "cantidadUnidad",
      header: "Cantidad",
      width: "150px",
    },
    ...(hasPermission("rates.view")
      ? [{
          accessorKey: "tarifaNombre" as keyof SalidaExternaCantidad,
          header: "Tarifa",
          width: "150px",
        }]
      : []),
    {
      accessorKey: "gestorNombre",
      header: "Gestor",
      width: "200px",
    },
    ...(hasPermission("rates.view")
      ? [{
          accessorKey: "tarifaGestorNombre" as keyof SalidaExternaCantidad,
          header: "Tarifa Gestor",
          width: "150px",
        }]
      : []),
    {
      id: "actions",
      header: "Acciones",
      width: "160px",
      cell: ({ row }) => {
        const obj = row.original
        return (
          <TooltipProvider>
            <div className="flex items-center space-x-2">
              {hasPermission("salidaexterna.edit") ? (
                <>
                  <ButtonTooltip variant="ghost" size="sm" onClick={() => handleEdit(obj)} tooltipContent="Editar">
                    <Edit className="h-4 w-4" />
                  </ButtonTooltip>
                  <ButtonTooltip variant="ghost" size="sm" onClick={() => handleDelete(obj.id)} className="new-text-red-600" tooltipContent="Eliminar">
                    <Trash2 className="h-4 w-4" />
                  </ButtonTooltip>
                </>
              ) : (
                <ButtonTooltip variant="ghost" size="sm" onClick={() => handleView(obj)} tooltipContent="Ver">
                  <Eye className="h-4 w-4" />
                </ButtonTooltip>
              )}
              {hasPermission("users.historial") && (
                <ButtonTooltip variant="ghost" size="sm" onClick={() => handleHistorial(obj)} tooltipContent="Historial">
                  <History className="h-4 w-4" />
                </ButtonTooltip>
              )}
            </div>
          </TooltipProvider>
        )
      },
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando cantidades...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[1050px] max-h-[95vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle>Cantidades de salida externa {salidaExterna.num ? `SEXT${String(salidaExterna.num).padStart(5, "0")}` : ""}</DialogTitle>
          </DialogHeader>

          <div className="flex justify-between items-center shrink-0">
            <div className="text-sm text-muted-foreground"></div>
            {hasPermission("salidaexterna.edit") && (
              <Button onClick={handleCreate} className="bg-primary hover:bg-primary-hover">
                <Plus className="mr-2 h-4 w-4" />Agregar Cantidad
              </Button>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <DataTable
              columns={columns}
              data={amounts}
              searchKey={["tResiduoNombre", "cantidadUnidad", "tarifaNombre", "contenedorNombre", "gestorNombre"]}
              searchPlaceholder="Buscar cantidad..."
            />
          </div>

          <DialogFooter className="shrink-0">
            <Button type="button" variant="outline" onClick={handleCancel}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SalidaExternaCantidadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        cantidad={selectedAmount}
        salidaExterna={salidaExterna}
        contenedores={contenedores}
        tiposResiduos={tiposResiduos}
        gestores={gestores}
        tiposTratamiento={tiposTratamiento}
        onSuccess={loadData}
        readOnly={dialogReadOnly}
      />

      <ConfirmationDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Eliminar cantidad"
        description="¿Está seguro de eliminar esta cantidad? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      <HistorialDialog
        open={historialOpen}
        onOpenChange={setHistorialOpen}
        tipo="SalidaExternaCantidad"
        id={historialId}
        label={historialLabel}
      />
    </>
  )
}
