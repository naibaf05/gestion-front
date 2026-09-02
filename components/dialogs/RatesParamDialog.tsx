"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { Check, CircleDollarSign, Edit, Eye, Plus, PowerSquare } from "lucide-react"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { Parametrizacion, RateParam } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { rateParamService } from "@/services/rateParamService"
import { parametrizationService } from "@/services/parametrizationService"
import { RateParamDialog } from "./RateParamDialog"

interface RatesParamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parametrizacion?: Parametrizacion | null
  readOnly?: boolean
  canEdit?: boolean
}

export function RatesParamDialog({
  open,
  onOpenChange,
  parametrizacion,
  readOnly = false,
  canEdit = false,
}: RatesParamDialogProps) {
  const [rates, setRates] = useState<RateParam[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [undMedidas, setUndMedidas] = useState<Parametrizacion[]>([])
  const [tiposResiduos, setTiposResiduos] = useState<Parametrizacion[]>([])
  const [selectedRate, setSelectedRate] = useState<RateParam | null>(null)
  const [rateDialogReadOnly, setRateDialogReadOnly] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [rateToToggle, setRateToToggle] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (open) loadData()
  }, [parametrizacion, open])

  const loadData = async () => {
    try {
      if (parametrizacion) {
        setLoading(true)
        const [ratesData, undMedidasData, tiposResiduosData] = await Promise.all([
          rateParamService.getTable(parametrizacion.id),
          parametrizationService.getListaActivos("und_medida"),
          parametrizationService.getListaActivos("t_residuo"),
        ])
        setRates(ratesData)
        setUndMedidas(undMedidasData)
        setTiposResiduos(tiposResiduosData)
      }
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

  const handleCreate = () => {
    if (readOnly || !canEdit) return
    setSelectedRate(null)
    setRateDialogReadOnly(false)
    setDialogOpen(true)
  }

  const handleEdit = (rate: RateParam) => {
    if (readOnly || !canEdit) return
    setSelectedRate(rate)
    setRateDialogReadOnly(false)
    setDialogOpen(true)
  }

  const handleView = (rate: RateParam) => {
    setSelectedRate(rate)
    setRateDialogReadOnly(true)
    setDialogOpen(true)
  }

  const handleToggleStatus = (id: string) => {
    if (readOnly || !canEdit) return
    setRateToToggle(id)
    setStatusDialogOpen(true)
  }

  const confirmToggleStatus = async () => {
    if (!rateToToggle) return
    try {
      await rateParamService.toggleStatus(rateToToggle)
      toast({
        title: "Estado actualizado",
        description: "El estado de la tarifa ha sido actualizado",
        variant: "success",
      })
      loadData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "No se pudo actualizar el estado",
        variant: "error",
      })
      loadData()
    } finally {
      setRateToToggle(null)
      setStatusDialogOpen(false)
    }
  }

  const cancelToggleStatus = () => {
    setRateToToggle(null)
    setStatusDialogOpen(false)
  }

  const columns: ColumnDef<RateParam>[] = [
    {
      width: "150px",
      accessorKey: "undMedidaNombre",
      header: "Unidad de Medida",
    },
    {
      width: "150px",
      accessorKey: "tipoResiduoCodigo",
      header: "Cod. Tipo de Residuo",
    },
    {
      width: "250px",
      accessorKey: "tipoResiduoNombre",
      header: "Tipo de Residuo",
    },
    {
      width: "100px",
      accessorKey: "tarifaNombre",
      header: "Tarifa",
    },
    {
      width: "120px",
      accessorKey: "fechaInicio",
      header: "Fecha Inicio",
    },
    {
      width: "120px",
      accessorKey: "fechaFin",
      header: "Fecha Fin",
    },
    {
      width: "120px",
      accessorKey: "puestoPlanta",
      header: "Puesto en planta",
      cell: ({ row }) => {
        return row.getValue("puestoPlanta") ? <Check className="h-4 w-4" /> : null
      },
    },
    {
      width: "100px",
      accessorKey: "activo",
      header: "Estado",
      cell: ({ row }) => (
        <Badge variant={row.getValue("activo") ? "default" : "secondary"}>
          {row.getValue("activo") ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      width: "130px",
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const rate = row.original
        return (
          <div className="flex items-center space-x-2">
            {canEdit && !readOnly ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(rate)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleStatus(rate.id)}
                  className={rate.activo ? "new-text-green-600" : "new-text-red-600"}
                >
                  <PowerSquare className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => handleView(rate)} title="Ver">
                <Eye className="h-4 w-4" />
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[95vh] overflow-y-auto" style={{ maxWidth: "80%" }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CircleDollarSign className="h-5 w-5" />
              Tarifas - [{parametrizacion ? parametrizacion.nombre : ""}]
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <div />
                {!readOnly && canEdit && (
                  <Button onClick={handleCreate} className="bg-primary hover:bg-primary-hover">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Tarifa
                  </Button>
                )}
              </div>

              <DataTable
                columns={columns}
                data={rates}
                searchKey={["undMedidaNombre", "tipoResiduoCodigo", "tipoResiduoNombre", "tarifaNombre"]}
                searchPlaceholder="Buscar por unidad de medida..."
              />
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RateParamDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        rate={selectedRate}
        parametrizacion={parametrizacion}
        undMedidas={undMedidas}
        tiposResiduos={tiposResiduos}
        onSuccess={loadData}
        readOnly={rateDialogReadOnly}
      />

      <ConfirmationDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        title="Cambiar Estado"
        description="¿Estás seguro de que deseas cambiar el estado de esta tarifa?"
        onConfirm={confirmToggleStatus}
        onCancel={cancelToggleStatus}
      />
    </>
  )
}
