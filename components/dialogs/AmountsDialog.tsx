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
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Edit, Plus, TableProperties } from "lucide-react"
import { Parametrizacion, VisitaCantidad, VisitaRecol } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { rateService } from "@/services/rateService"
import { parametrizationService } from "@/services/parametrizationService"
import { visitService } from "@/services/visitService";
import { AmountDialog } from "./AmountDialog";

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
  const [amounts, setAmounts] = useState<VisitaCantidad[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [contenedores, setContenedores] = useState<Parametrizacion[]>([])
  const [tiposResiduos, setTiposResiduos] = useState<Parametrizacion[]>([])
  const [selectedAmount, setSelectedAmount] = useState<VisitaCantidad | null>(null)
  const { toast } = useToast()

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
          parametrizationService.getListaActivos("t_residuo"),
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

  const handleToggleStatus = async (id: string) => {
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

  const columns: ColumnDef<VisitaCantidad>[] = [
    {
      accessorKey: "tResiduoNombre",
      header: "Tipo de Residuo",
    },
    {
      accessorKey: "contenedorNombre",
      header: "Contenedor",
    },
    {
      accessorKey: "numContenedor",
      header: "Num Contenedor",
    },
    {
      accessorKey: "tarifaNombre",
      header: "Tarifa",
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const obj = row.original
        return (
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => handleEdit(obj)}>
              <Edit className="h-4 w-4" />
            </Button>
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
    </>
  )
}
