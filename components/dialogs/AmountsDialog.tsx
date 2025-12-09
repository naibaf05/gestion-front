"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Edit, Eye, History, Plus, TableProperties, Trash2 } from "lucide-react"
import { Parametrizacion, TipoResiduo, VisitaCantidad, VisitaRecol } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { parametrizationService } from "@/services/parametrizationService"
import { visitService } from "@/services/visitService";
import { AmountDialog } from "./AmountDialog";
import { ButtonTooltip } from "../ui/button-tooltip";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { HistorialDialog } from "./HistorialDialog";

interface AmountsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  visitaRecol: VisitaRecol
}

export function AmountsDialog({
  open,
  onOpenChange,
  visitaRecol,
}: AmountsDialogProps) {
  const { user, logout } = useAuth()
  const [amounts, setAmounts] = useState<VisitaCantidad[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogReadOnly, setDialogReadOnly] = useState(false)
  const [contenedores, setContenedores] = useState<Parametrizacion[]>([])
  const [tiposResiduos, setTiposResiduos] = useState<TipoResiduo[]>([])
  const [selectedAmount, setSelectedAmount] = useState<VisitaCantidad | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [amountToDelete, setAmountToDelete] = useState<string | null>(null)
  const { toast } = useToast()

  // Historial
  const [historialOpen, setHistorialOpen] = useState(false);
  const [historialId, setHistorialId] = useState<string>("");
  const [historialLabel, setHistorialLabel] = useState<string>("");

  if (user && user.permisos && typeof user.permisos === "string") {
    user.permisos = JSON.parse(user.permisos);
  }

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permisos) return false
    if (user.perfil?.nombre === "ADMIN") return true
    return user.permisos[permission] === true
  }

  useEffect(() => {
    loadData()
  }, [visitaRecol])

  const handleCancel = () => {
    onOpenChange(false)
  }

  const loadData = async () => {
    try {
      if (visitaRecol) {
        setLoading(true)
        const [amountsData, contenedoresData, tiposResiduosData] = await Promise.all([
          visitService.getCantidades(visitaRecol.id),
          parametrizationService.getListaActivos("contenedor"),
          parametrizationService.getListaTResiduosActivos(visitaRecol.sedeId, visitaRecol.fecha),
        ])
        setAmounts(amountsData);
        setContenedores(contenedoresData);
        setTiposResiduos(tiposResiduosData);
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
    if (!hasPermission("amount.edit")) return
    setSelectedAmount(null)
    setDialogReadOnly(false)
    setDialogOpen(true)
  }

  const handleEdit = (obj: VisitaCantidad) => {
    if (!hasPermission("amount.edit")) return
    setSelectedAmount(obj)
    setDialogReadOnly(false)
    setDialogOpen(true)
  }

  const handleView = (obj: VisitaCantidad) => {
    setSelectedAmount(obj)
    setDialogReadOnly(true)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (!hasPermission("amount.edit")) return
    setAmountToDelete(id)
    setConfirmDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!amountToDelete) return

    try {
      await visitService.deleteCantidad(amountToDelete);
      toast({
        title: "Cantidad eliminada",
        description: "La cantidad ha sido eliminada exitosamente",
        variant: "success",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la cantidad",
        variant: "destructive",
      });
    } finally {
      setAmountToDelete(null)
    }
  }

  const cancelDelete = () => {
    setAmountToDelete(null)
  }

  const handleHistorial = (item: VisitaCantidad) => {
    setSelectedAmount(item);
    setHistorialId(item.id || "");
    setHistorialLabel(`Cantidad [${item.tResiduoNombre} - ${item.cantidadUnidad}]`);
    setHistorialOpen(true);
  };

  const columns: ColumnDef<VisitaCantidad>[] = [
    {
      accessorKey: "tResiduoNombre",
      header: "Tipo de Residuo",
      width: "350px",
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
    ...(hasPermission("rates.view") ? [{
      accessorKey: "tarifaNombre" as keyof VisitaCantidad,
      header: "Tarifa",
      width: "150px",
    }] : []),
    {
      id: "actions",
      header: "Acciones",
      width: "160px",
      cell: ({ row }) => {
        const obj = row.original
        return (
          <TooltipProvider>
            <div className="flex items-center space-x-2">
              {hasPermission("amount.edit") ? (
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
        <DialogContent className="sm:max-w-[1050px] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TableProperties className="h-5 w-5" />
              Administración de Cantidades
            </DialogTitle>
          </DialogHeader>

          <div className="flex justify-between items-center">
            <div></div>
            {hasPermission("amount.edit") && (
              <Button onClick={handleCreate} className="bg-primary hover:bg-primary-hover">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Cantidad
              </Button>
            )}
          </div>

          <DataTable columns={columns} data={amounts} searchKey="undMedidaNombre" searchPlaceholder="Buscar..." />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AmountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        cantidad={selectedAmount}
        visitaRecol={visitaRecol}
        tiposResiduos={tiposResiduos}
        contenedores={contenedores}
        onSuccess={loadData}
        readOnly={dialogReadOnly}
      />

      <ConfirmationDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Eliminar cantidad"
        description="¿Estás seguro de que deseas eliminar esta cantidad?"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      <HistorialDialog
        open={historialOpen}
        onOpenChange={setHistorialOpen}
        tipo="VisitaCantidad"
        id={historialId}
        label={historialLabel}
      />
    </>
  )
}
