"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Edit, Plus, TableProperties, Trash2 } from "lucide-react"
import { Parametrizacion, TipoResiduo, VisitaCantidad, VisitaRecol } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { parametrizationService } from "@/services/parametrizationService"
import { visitService } from "@/services/visitService";
import { AmountDialog } from "./AmountDialog";
import { ButtonTooltip } from "../ui/button-tooltip";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useAuth } from "@/contexts/AuthContext";

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
  const [contenedores, setContenedores] = useState<Parametrizacion[]>([])
  const [tiposResiduos, setTiposResiduos] = useState<TipoResiduo[]>([])
  const [selectedAmount, setSelectedAmount] = useState<VisitaCantidad | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [amountToDelete, setAmountToDelete] = useState<string | null>(null)
  const { toast } = useToast()

  if (user && user.permisos && typeof user.permisos === "string") {
    user.permisos = JSON.parse(user.permisos);
  }

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permisos) return false
    if (user.rolNombre === "ADMIN") return true
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
    setSelectedAmount(null)
    setDialogOpen(true)
  }

  const handleEdit = (obj: VisitaCantidad) => {
    setSelectedAmount(obj)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
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
        variant: "default",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: (error && error.message ? error.message : "No se pudo eliminar la cantidad"),
        variant: "destructive",
      });
    } finally {
      setAmountToDelete(null)
    }
  }

  const cancelDelete = () => {
    setAmountToDelete(null)
  }

  const columns: ColumnDef<VisitaCantidad>[] = [
    {
      accessorKey: "tResiduoNombre",
      header: "Tipo de Residuo",
    },
    {
      accessorKey: "numContenedor",
      header: "Unidades",
    },
    {
      accessorKey: "cantidadUnidad",
      header: "Cantidad",
    },
    ...(hasPermission("rates.view") ? [{
      accessorKey: "tarifaNombre" as keyof VisitaCantidad,
      header: "Tarifa",
    }] : []),
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const obj = row.original
        return (
          <TooltipProvider>
            <div className="flex items-center space-x-2">
              <ButtonTooltip variant="ghost" size="sm" onClick={() => handleEdit(obj)} tooltipContent="Editar">
                <Edit className="h-4 w-4" />
              </ButtonTooltip>
              <ButtonTooltip variant="ghost" size="sm" onClick={() => handleDelete(obj.id)} className="new-text-red-600" tooltipContent="Eliminar">
                <Trash2 className="h-4 w-4" />
              </ButtonTooltip>
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
            <Button onClick={handleCreate} className="bg-primary hover:bg-primary-hover">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Cantidad
            </Button>
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
      />

      <ConfirmationDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Eliminar cantidad"
        description="¿Estás seguro de que deseas eliminar esta cantidad?"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </>
  )
}
