"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Plus, Edit, Check, PlusCircle, TableProperties, FileText, Trash2 } from "lucide-react"
import { userService } from "@/services/userService"
import type { Parametrizacion, ProgVisitaRecol, Sede, User, Vehicle, VisitaRecol } from "@/types"
import { useToast } from "@/hooks/use-toast"
import type { ColumnDef } from "@tanstack/react-table"
import { progService } from "@/services/progService"
import { Badge } from "@/components/ui/badge"
import { VisitDialog } from "@/components/dialogs/VisitDialog"
import { clientService } from "@/services/clientService"
import { vehicleService } from "@/services/vehicleService"
import { parametrizationService } from "@/services/parametrizationService"
import { visitService } from "@/services/visitService"
import { AmountsDialog } from "@/components/dialogs/AmountsDialog"
import { ButtonTooltip } from "@/components/ui/button-tooltip"
import { TooltipProvider } from "@/components/ui/tooltip"
import { PdfDialog } from "@/components/dialogs/PdfDialog"
import { certificatesService } from "@/services/certificatesService"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

export default function ProgsAdminPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAmountsOpen, setDialogAmountsOpen] = useState(false);
  const [dialogPdfOpen, setDialogPdfOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(today);
  });
  const [progs, setProgs] = useState<ProgVisitaRecol[]>([])
  const [sedes, setSedes] = useState<Sede[]>([])
  const [vehiculos, setVehiculos] = useState<Vehicle[]>([])
  const [recolectores, setRecolectores] = useState<User[]>([])
  const [comerciales, setComerciales] = useState<Parametrizacion[]>([])
  const [visitaRecol, setVisitaRecol] = useState<VisitaRecol | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ProgVisitaRecol | null>(null)
  const [base64, setBase64] = useState<string | null>(null)
  const { toast } = useToast()

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [idToConfirm, setIdToConfirm] = useState<string | null>(null)
  const [tipoConfirm, setTipoConfirm] = useState<string | null>(null)
  const [titleConfirm, setTitleConfirm] = useState<string | null>(null)
  const [descripcionConfirm, setDescripcionConfirm] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [selectedDate])

  const loadData = async () => {
    try {
      setLoading(true)
      const [progsData, sedesData, vehiclesData, recolData, comercialData] = await Promise.all([
        progService.getDataProgsAdmin(selectedDate),
        clientService.getSedesActivas(),
        vehicleService.getVehiclesActivos(),
        userService.getUsersActivos(),
        parametrizationService.getListaActivos("comercial")
      ])
      setProgs(progsData);
      setSedes(sedesData);
      setVehiculos(vehiclesData);
      setRecolectores(recolData);
      setComerciales(comercialData);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setVisitaRecol(null);
    setSelected(null)
    setDialogOpen(true)
  }

  const handleEdit = async (obj: ProgVisitaRecol) => {
    const visita = await visitService.getId(obj.visitaRecolId);
    setVisitaRecol(visita);
    setSelected(obj);
    setDialogOpen(true);
  }

  const handleEditNew = (obj: ProgVisitaRecol) => {
    setVisitaRecol(null);
    setSelected(obj)
    setDialogOpen(true)
  }

  const handleAmounts = async (obj: ProgVisitaRecol) => {
    const visita = await visitService.getId(obj.visitaRecolId);
    setVisitaRecol(visita);
    setSelected(obj);
    setDialogAmountsOpen(true);
  }

  const handlePdf = async (obj: ProgVisitaRecol) => {
    const base64 = await certificatesService.getCertificadoRecoleccionPDF();
    setBase64(base64);
    setSelected(obj);
    setDialogPdfOpen(true);
  }

  const handleDelete = async (id: string) => {
    setIdToConfirm(id)
    setTipoConfirm("1")
    setTitleConfirm("Eliminar")
    setDescripcionConfirm("¿Estás seguro de que deseas eliminar esta visita?")
    setConfirmDialogOpen(true)
  }

  const confirm = async () => {
    if (!idToConfirm) return

    try {
      if (tipoConfirm === "1") {
        await progService.deleteVisita(idToConfirm);
        toast({
          title: "Visita eliminada",
          description: "La visita ha sido eliminada exitosamente",
          variant: "success",
        });
      }
      loadData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: (error && error.message ? error.message : "No se pudo realizar la acción"),
        variant: "destructive",
      });
    } finally {
      setIdToConfirm(null)
    }
  }

  const cancel = () => {
    setIdToConfirm(null)
  }

  const columns: ColumnDef<ProgVisitaRecol>[] = [
    {
      accessorKey: "tipoNombre",
      header: "Tipo",
      cell: ({ row }) => {
        return (
          <Badge className={row.original.tipoColor}>
            {row.original.tipoNombre}
          </Badge>
        );
      },
      enableColumnFilter: true
    },
    {
      accessorKey: "sedeNombre",
      header: "Sede",
      enableColumnFilter: true
    },
    {
      accessorKey: "recolNombre",
      header: "Recolector",
      cell: ({ row }) => {
        return `${row.original.recolNombre} ${row.original.recolApellido}`
      },
    },
    {
      accessorKey: "vehInterno",
      header: "Vehículo",
    },
    {
      accessorKey: "novs",
      header: "Novedades",
      cell: ({ row }) => {
        const obj = row.getValue("novs");
        return (
          obj ? <Check className="h-4 w-4" /> : null
        );
      },
    },
    {
      accessorKey: "inicio",
      header: "Inicio",
    },
    {
      accessorKey: "visitaRecolId",
      header: "Visita",
      cell: ({ row }) => {
        const obj = row.getValue("visitaRecolId");
        return (
          obj ? <Check className="h-4 w-4" /> : null
        );
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const obj = row.original
        return (
          <TooltipProvider>
            <div className="flex items-center space-x-2">
              {obj.visitaRecolId ?
                <>
                  <ButtonTooltip variant="ghost" size="sm" onClick={() => handleEdit(obj)} tooltipContent="Editar">
                    <Edit className="h-4 w-4" />
                  </ButtonTooltip>
                  <ButtonTooltip variant="ghost" size="sm" onClick={() => handleAmounts(obj)} tooltipContent="Cantidades">
                    <TableProperties className="h-4 w-4" />
                  </ButtonTooltip>
                  <ButtonTooltip variant="ghost" size="sm" onClick={() => handlePdf(obj)} tooltipContent="PDF">
                    <FileText className="h-4 w-4" />
                  </ButtonTooltip>
                  {obj.tipo === "puesto" ?
                    <ButtonTooltip variant="ghost" size="sm" onClick={() => handleDelete(obj.visitaRecolId)} tooltipContent="Eliminar" className="new-text-red-600" >
                      <Trash2 className="h-4 w-4" />
                    </ButtonTooltip>
                    : ''
                  }
                </>
                :
                <ButtonTooltip variant="ghost" size="sm" onClick={() => handleEditNew(obj)} tooltipContent="Agregar">
                  <PlusCircle className="h-4 w-4" />
                </ButtonTooltip>
              }
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
          <p className="mt-2 text-sm text-gray-600">Cargando administración recolección...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Administración Recolecciones</h1>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="fecha"
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
      </div>

      <Card>
        <CardContent>
          <div className="flex justify-between items-center">
            <div></div>
            <Button onClick={handleCreate} className="bg-primary hover:bg-primary-hover">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Visita
            </Button>
          </div>
          <DataTable columns={columns} data={progs} searchKey={["tipo", "sedeNombre", "recolNombre", "vehInterno"]} searchPlaceholder="Buscar por nombre..." />
        </CardContent>
      </Card>

      <VisitDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedDate={selectedDate}
        visitaId={selected ? selected.visitaRecolId : null}
        visita={visitaRecol}
        progVisitaRecol={selected}
        sedes={sedes}
        vehiculos={vehiculos}
        recolectores={recolectores}
        comerciales={comerciales}
        onSuccess={loadData}
      />

      {visitaRecol && (
        <AmountsDialog
          open={dialogAmountsOpen}
          onOpenChange={setDialogAmountsOpen}
          visitaRecol={visitaRecol}
        />
      )}

      {base64 && (
        <PdfDialog
          open={dialogPdfOpen}
          onOpenChange={setDialogPdfOpen}
          base64={base64}
        />
      )}

      <ConfirmationDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title={titleConfirm || "Confirmar"}
        description={descripcionConfirm || "¿Estás seguro de que deseas eliminar este elemento?"}
        onConfirm={confirm}
        onCancel={cancel}
      />
    </div>
  )
}