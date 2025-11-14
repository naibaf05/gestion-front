"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Plus, Edit, Check, PlusCircle, TableProperties, FileText, Trash2, Paperclip } from "lucide-react"
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
import { PdfDialog } from "@/components/dialogs/PdfDialog"
import { certificatesService } from "@/services/certificatesService"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { DatePicker } from "@/components/ui/date-picker"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { AdjuntosDialog } from "@/components/dialogs/AdjuntosDialog"

export default function ProgsAdminPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAmountsOpen, setDialogAmountsOpen] = useState(false);
  const [dialogPdfOpen, setDialogPdfOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today;
  });
  const [fechaFin, setFechaFin] = useState(() => {
    const today = new Date();
    return today;
  });
  const [dateString, setDateString] = useState(() => {
    const today = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(today);
  });
  const [fechaFinString, setFechaFinString] = useState(() => {
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
  const [plantas, setPlantas] = useState<Parametrizacion[]>([])
  const [visitaRecol, setVisitaRecol] = useState<VisitaRecol | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ProgVisitaRecol | null>(null)
  const [base64, setBase64] = useState<string | null>(null)
  const { toast } = useToast()
  const loadingTimeoutRef = useRef<NodeJS.Timeout>()

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [idToConfirm, setIdToConfirm] = useState<string | null>(null)
  const [tipoConfirm, setTipoConfirm] = useState<string | null>(null)
  const [titleConfirm, setTitleConfirm] = useState<string | null>(null)
  const [descripcionConfirm, setDescripcionConfirm] = useState<string | null>(null)
  const [confirmText, setConfirmText] = useState<string | null>(null)
  const [cancelText, setCancelText] = useState<string | null>(null)
  const [hideCancelConfirm, setHideCancelConfirm] = useState<boolean>(false)

  const [adjuntosOpen, setAdjuntosOpen] = useState(false)
  const [entidadId, setEntidadId] = useState<string | null>(null)

  // Obtener tipos únicos para mostrar la leyenda
  const tiposUnicos = progs.reduce((acc: { nombre: string, color: string }[], prog) => {
    const existe = acc.find(tipo => tipo.nombre === prog.tipoNombre);
    if (!existe) {
      acc.push({ nombre: prog.tipoNombre || '', color: prog.tipoColor || '' });
    }
    return acc;
  }, []);

  useEffect(() => {
    // Limpiar timeout anterior si existe
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
    }

    // Agregar un pequeño delay para evitar múltiples llamadas
    loadingTimeoutRef.current = setTimeout(() => {
      loadData()
    }, 100)

    // Cleanup function
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [dateString, fechaFinString])

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate && !isNaN(newDate.getTime())) {
      // Validar que la fecha inicio no sea mayor que la fecha fin
      if (fechaFin && newDate > fechaFin) {
        toast({
          title: "Fecha inválida",
          description: "La fecha inicio no puede ser mayor que la fecha fin",
          variant: "destructive",
        });
        return;
      }

      setSelectedDate(newDate);
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      setDateString(formatter.format(newDate));
    }
  };

  const handleFechaFinChange = (newDate: Date | undefined) => {
    if (newDate && !isNaN(newDate.getTime())) {
      // Validar que la fecha fin no sea menor que la fecha inicio
      if (selectedDate && newDate < selectedDate) {
        toast({
          title: "Fecha inválida",
          description: "La fecha fin no puede ser menor que la fecha inicio",
          variant: "destructive",
        });
        return;
      }

      setFechaFin(newDate);
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      setFechaFinString(formatter.format(newDate));
    }
  };

  const loadData = async () => {
    if (!dateString || !fechaFinString) {
      return;
    }

    try {
      setLoading(true)
      const [progsData, sedesData, vehiclesData, recolData, comercialData, plantasData] = await Promise.all([
        progService.getDataProgsAdmin(dateString, fechaFinString),
        clientService.getSedesActivas(),
        vehicleService.getVehiclesActivos(),
        userService.getUsersActivos(),
        parametrizationService.getListaActivos("comercial"),
        parametrizationService.getListaActivos("oficina")
      ])
      setProgs(progsData);
      setSedes(sedesData);
      setVehiculos(vehiclesData);
      setRecolectores(recolData);
      setComerciales(comercialData);
      setPlantas(plantasData);
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
    setSelected(obj)
    // Reglas de validación previas a la descarga/visualización del PDF
    // 1) Si tiene cartera pendiente, bloquear descarga y mostrar mensaje informativo
    if (obj.tieneCartera === 1) {
      setSelected(obj)
      setTipoConfirm("cartera")
      setTitleConfirm("Certificado no disponible")
      setDescripcionConfirm(
        "Estimado usuario, para poder acceder al certificado solicitado, es necesario que se encuentre al día en su estado de cuenta. Por favor, regularice su cartera pendiente para habilitar la descarga."
      )
      setConfirmText("Entendido")
      setCancelText("")
      setHideCancelConfirm(true)
      setConfirmDialogOpen(true)
      return
    }

    // 2) Si aún no ha sido facturado, mostrar advertencia no bloqueante y continuar al aceptar
    if (obj.noFactura === 1) {
      setSelected(obj)
      setTipoConfirm("pdf-no-facturado")
      setTitleConfirm("Certificado no disponible")
      setDescripcionConfirm(
        "El servicio asociado a este certificado aún no ha sido facturado. Una vez se emita la factura correspondiente y realice el pago correspondiente, el sistema habilitará la descarga del documento."
      )
      setConfirmText("Entendido")
      setCancelText("")
      setHideCancelConfirm(false)
      setConfirmDialogOpen(true)
      return
    }

    // 3) Caso normal: descargar/abrir directamente
    handlePdfNoValidate(obj)
  }

  const handlePdfNoValidate = async (obj: ProgVisitaRecol) => {
    const base64 = await certificatesService.getCertificadoVisitaPDF(obj.visitaRecolId)
    setBase64(base64)
    setDialogPdfOpen(true)
  }

  const handleDelete = async (id: string) => {
    setIdToConfirm(id)
    setTipoConfirm("1")
    setTitleConfirm("Eliminar")
    setDescripcionConfirm("¿Estás seguro de que deseas eliminar esta visita?")
    setConfirmText("Eliminar")
    setCancelText("Cancelar")
    setHideCancelConfirm(false)
    setConfirmDialogOpen(true)
  }

  const handleAdjuntos = async (id: string) => {
    setEntidadId(id)
    setAdjuntosOpen(true)
  }

  const confirm = async () => {
    try {
      if (tipoConfirm === "1") {
        if (!idToConfirm) return
        await progService.deleteVisita(idToConfirm);
        toast({
          title: "Visita eliminada",
          description: "La visita ha sido eliminada exitosamente",
          variant: "success",
        });
      } else if (tipoConfirm === "pdf-no-facturado") {
        if (selected) {
          handlePdfNoValidate(selected)
        }
      } else if (tipoConfirm === "cartera") {
        if (selected) {
          handlePdfNoValidate(selected)
        }
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
      setConfirmText(null)
      setCancelText(null)
      setHideCancelConfirm(false)
    }
  }

  const cancel = () => {
    setIdToConfirm(null)
  }

  // Procesar datos para filtros personalizados
  const processedProgs = useMemo(() => {
    return progs.map(prog => ({
      ...prog,
      tipoNombreDisplay: prog.tipoNombre?.charAt(0)?.toUpperCase() || ''
    }));
  }, [progs]);

  const columns: ColumnDef<ProgVisitaRecol>[] = [
    {
      accessorKey: "tipoNombreDisplay",
      header: "Tipo",
      width: "6%",
      cell: ({ row }) => {
        const primeraLetra = row.original.tipoNombre?.charAt(0)?.toUpperCase() || '';
        return (
          <Badge className={row.original.tipoColor}>
            {primeraLetra}
          </Badge>
        );
      },
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        // Filtrar por el nombre completo del tipo
        const tipoNombre = row.original.tipoNombre;
        if (!tipoNombre) return false;

        if (Array.isArray(value)) {
          return value.some(v => {
            // Si el valor del filtro es una letra, comparar con la primera letra
            if (v.length === 1) {
              return tipoNombre.charAt(0).toUpperCase() === v.toUpperCase();
            }
            // Si no, comparar con el nombre completo
            return tipoNombre.toLowerCase().includes(v.toLowerCase());
          });
        }
        return tipoNombre.toLowerCase().includes(value.toLowerCase());
      }
    },
    {
      accessorKey: "clienteNombre",
      header: "Cliente",
      width: "25%",
      enableColumnFilter: true
    },
    {
      accessorKey: "sedeNombre",
      header: "Sede",
      width: "25%",
      enableColumnFilter: true
    },
    {
      accessorKey: "recolNombre",
      header: "Recolector",
      width: "15%",
      cell: ({ row }) => {
        return `${row.original.recolNombre} ${row.original.recolApellido}`
      },
    },
    {
      accessorKey: "vehInterno",
      header: "Vehículo",
      width: "10%",
    },
    {
      accessorKey: "fecha",
      header: "Fecha",
      width: "10%",
    },
    {
      accessorKey: "visitaRecolId",
      header: "Visita",
      width: "5%",
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
      width: "15%",
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
                </>
                :
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
                  <ButtonTooltip variant="ghost" size="sm" onClick={() => handleEditNew(obj)} tooltipContent="Agregar">
                    <PlusCircle className="h-4 w-4" />
                  </ButtonTooltip>
                </>
              }
              <DropdownMenu>
                <Tooltip>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <span className="sr-only">Más acciones</span>
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                        <circle cx="5" cy="12" r="2" fill="currentColor" />
                        <circle cx="12" cy="12" r="2" fill="currentColor" />
                        <circle cx="19" cy="12" r="2" fill="currentColor" />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <TooltipContent>Más acciones</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleDelete(obj.visitaRecolId)} className="new-text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAdjuntos(obj.visitaRecolId)}>
                    <Paperclip className="h-4 w-4 mr-2" />
                    Adjuntos
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Inicio:</label>
            <DatePicker
              date={selectedDate}
              onDateChange={handleDateChange}
              placeholder="dd/mm/aaaa"
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Fin:</label>
            <DatePicker
              date={fechaFin}
              onDateChange={handleFechaFinChange}
              placeholder="dd/mm/aaaa"
              className="w-40"
            />
          </div>
        </div>
      </div>

      <Card>
        <CardContent>
          <div className="flex justify-between items-center">
            {tiposUnicos.length > 0 ? (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold mb-2 text-gray-700">Leyenda de Tipos:</h3>
                <div className="flex flex-wrap gap-2">
                  {tiposUnicos.map((tipo, index) => (
                    <div key={index} className="flex items-center space-x-1">
                      <Badge className={tipo.color}>
                        {tipo.nombre.charAt(0).toUpperCase()}
                      </Badge>
                      <span className="text-sm text-gray-600">{tipo.nombre}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div />
            )}
            <Button onClick={handleCreate} className="bg-primary hover:bg-primary-hover">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Visita
            </Button>
          </div>
          <DataTable
            columns={columns}
            data={processedProgs}
            layoutMode="fixed"
            searchKey={["tipo", "sedeNombre", "recolNombre", "vehInterno"]}
            searchPlaceholder="Buscar por nombre..."
          />
        </CardContent>
      </Card>

      <VisitDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedDate={dateString}
        visitaId={selected ? selected.visitaRecolId : null}
        visita={visitaRecol}
        progVisitaRecol={selected}
        sedes={sedes}
        vehiculos={vehiculos}
        recolectores={recolectores}
        comerciales={comerciales}
        plantas={plantas}
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
        confirmText={confirmText || undefined}
        cancelText={cancelText || undefined}
        hideCancel={hideCancelConfirm}
        onConfirm={confirm}
        onCancel={cancel}
      />

      <AdjuntosDialog
        open={adjuntosOpen}
        onOpenChange={setAdjuntosOpen}
        tipo="progs"
        entityId={entidadId || ""}
        title="Adjuntos"
      />
    </div>
  )
}