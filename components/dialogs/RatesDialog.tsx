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
import { Badge } from "@/components/ui/badge";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Check, CircleDollarSign, Edit, Eye, Plus, PowerSquare } from "lucide-react"
import { Parametrizacion, Rate, Sede } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { rateService } from "@/services/rateService"
import { parametrizationService } from "@/services/parametrizationService"
import { RateDialog } from "./RateDialog";

interface RatesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sede?: Sede | null
  readOnly?: boolean
  canEdit?: boolean
}

export function RatesDialog({
  open,
  onOpenChange,
  sede,
  readOnly = false,
  canEdit = false,
}: RatesDialogProps) {
  const [rates, setRates] = useState<Rate[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [undMedidas, setUndMedidas] = useState<Parametrizacion[]>([])
  const [tiposResiduos, setTiposResiduos] = useState<Parametrizacion[]>([])
  const [selectedRate, setSelectedRate] = useState<Rate | null>(null)
  const [rateDialogReadOnly, setRateDialogReadOnly] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [sede])

  const handleCancel = () => {
    onOpenChange(false)
  }

  const loadData = async () => {
    try {
      if (sede) {
        setLoading(true)
        const [ratesData, undMedidasData, tiposResiduosData] = await Promise.all([
          rateService.getTable(sede.id),
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

  const handleEdit = (rate: Rate) => {
    if (readOnly || !canEdit) return
    setSelectedRate(rate)
    setRateDialogReadOnly(false)
    setDialogOpen(true)
  }

  const handleView = (rate: Rate) => {
    // Permite ver cuando sólo tiene rates.view (readOnly true) o no canEdit
    setSelectedRate(rate)
    setRateDialogReadOnly(true)
    setDialogOpen(true)
  }

  const handleToggleStatus = async (id: string) => {
    if (readOnly || !canEdit) return
    if (confirm("¿Estás seguro de que deseas cambiar el estado a esta tarifa?")) {
      try {
        await rateService.toggleStatus(id);
        toast({
          title: "Estado actualizado",
          description: "El estado de la tarifa ha sido actualizado",
          variant: "success",
        });
        loadData();
      } catch (error: any) {
        toast({
          title: "Error",
          description: (error && error.message ? error.message : "No se pudo actualizar el estado"),
          variant: "error",
        });
        loadData();
      }
    }
  }

  const columns: ColumnDef<Rate>[] = [
    {
      accessorKey: "undMedidaNombre",
      header: "Unidad de Medida",
    },
    {
      accessorKey: "tipoResiduoCodigo",
      header: "Cod. Tipo de Residuo",
    },
    {
      accessorKey: "tipoResiduoNombre",
      header: "Tipo de Residuo",
    },
    {
      accessorKey: "tarifaNombre",
      header: "Tarifa",
    },
    {
      accessorKey: "fechaInicio",
      header: "Fecha Inicio",
      cell: ({ row }) => {
        const fecha = row.getValue("fechaInicio");
        if (typeof fecha === "string") {
          const [anio, mes, dia] = fecha.split("-");
          const fechaLocal = new Date(Number(anio), Number(mes) - 1, Number(dia));
          return fechaLocal.toLocaleDateString();
        } else {
          return "";
        }
      },
    },
    {
      accessorKey: "fechaFin",
      header: "Fecha Fin",
      cell: ({ row }) => {
        const fecha = row.getValue("fechaFin");
        if (typeof fecha === "string") {
          const [anio, mes, dia] = fecha.split("-");
          const fechaLocal = new Date(Number(anio), Number(mes) - 1, Number(dia));
          return fechaLocal.toLocaleDateString();
        } else {
          return "";
        }
      },
    },
    {
      accessorKey: "puestoPlanta",
      header: "Puesto en planta",
      cell: ({ row }) => {
        const obj = row.getValue("puestoPlanta");
        return (
          obj ? <Check className="h-4 w-4" /> : null
        );
      },
    },
    {
      accessorKey: "activo",
      header: "Estado",
      cell: ({ row }) => {
        return (
          <Badge variant={row.getValue("activo") ? "default" : "secondary"}>
            {row.getValue("activo") ? "Activo" : "Inactivo"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const prof = row.original
        return (
          <div className="flex items-center space-x-2">
            {canEdit && !readOnly ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(prof)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleStatus(prof.id)}
                  className={prof.activo ? "new-text-green-600" : "new-text-red-600"}
                >
                  <PowerSquare className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => handleView(prof)} title="Ver">
                <Eye className="h-4 w-4" />
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando perfiles...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[95vh] overflow-y-auto"
          style={{ maxWidth: '80%' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CircleDollarSign className="h-5 w-5" />
              Tarifas - [{sede ? sede.nombre : "Todas las sedes"}]
            </DialogTitle>
          </DialogHeader>

          <div className="flex justify-between items-center">
            <div></div>
            {!readOnly && canEdit && (
              <Button onClick={handleCreate} className="bg-primary hover:bg-primary-hover">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Tarifa
              </Button>
            )}
          </div>

          <DataTable columns={columns} data={rates} searchKey={["undMedidaNombre", "tipoResiduoCodigo", "tipoResiduoNombre", "tarifaNombre"]} searchPlaceholder="Buscar por unidad de medida..." />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {dialogOpen && (
        <RateDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            if (!open) setRateDialogReadOnly(false)
            setDialogOpen(open)
          }}
          rate={selectedRate}
          sede={sede}
          undMedidas={undMedidas}
          tiposResiduos={tiposResiduos}
          onSuccess={loadData}
          readOnly={rateDialogReadOnly || readOnly || !canEdit}
        />
      )}
    </>
  )
}
