"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, PowerSquare, FileText, Eye, CircleDollarSign } from "lucide-react";
import { clientService } from "@/services/clientService";
import { parametrizationService } from "@/services/parametrizationService";
import { salidaService } from "@/services/salidaService";
import type { Salida, Sede, Parametrizacion, Vehicle } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { SalidaDialog } from "@/components/dialogs/SalidaDialog";
import type { ColumnDef } from "@tanstack/react-table";
import { useAuth } from "@/contexts/AuthContext";
import { ButtonTooltip } from "@/components/ui/button-tooltip";
import { TooltipProvider } from "@/components/ui/tooltip";
import { certificatesService } from "@/services/certificatesService";
import { PdfDialog } from "@/components/dialogs/PdfDialog";
import { vehicleService } from "@/services/vehicleService";
import { DatePicker } from "@/components/ui/date-picker";
import { UpdateRatesDialog } from "@/components/dialogs/UpdateRatesDialog";

export default function SalidasPage() {
  const { user } = useAuth();

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

  const loadingTimeoutRef = useRef<NodeJS.Timeout>()

  const [base64, setBase64] = useState<string | null>(null);
  const [dialogPdfOpen, setDialogPdfOpen] = useState(false);

  const [salidas, setSalidas] = useState<Salida[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [plantas, setPlantas] = useState<Parametrizacion[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehicle[]>([]);
  const [productos, setProductos] = useState<Parametrizacion[]>([]);

  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSalida, setSelectedSalida] = useState<Salida | null>(null);
  const [dialogReadOnly, setDialogReadOnly] = useState(false);
  const [ratesDialogOpen, setRatesDialogOpen] = useState(false);
  const { toast } = useToast();

  if (user && user.permisos && typeof user.permisos === "string") {
    user.permisos = JSON.parse(user.permisos);
  }

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permisos) return false
    if (user.perfil?.nombre === "ADMIN") return true
    return user.permisos[permission] === true
  }

  useEffect(() => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
    }

    loadingTimeoutRef.current = setTimeout(() => {
      loadData()
    }, 100)

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [dateString, fechaFinString])

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate && !isNaN(newDate.getTime())) {
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
    try {
      setLoading(true);
      const [
        salidasData,
        sedesData,
        vehiculosData,
        productosData,
        plantasData
      ] = await Promise.all([
        salidaService.getSalidas(dateString, fechaFinString),
        clientService.getSedesActivas(),
        vehicleService.getVehiclesActivos(),
        parametrizationService.getListaActivos("t_residuo"),
        parametrizationService.getListaActivos("oficina"),
      ]);
      setSalidas(salidasData);
      setSedes(sedesData);
      setVehiculos(vehiculosData);
      setProductos(productosData);
      setPlantas(plantasData);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    if (!hasPermission("salida.edit")) return;
    setSelectedSalida(null);
    setDialogReadOnly(false);
    setDialogOpen(true);
  };

  const handleEdit = (salida: Salida) => {
    if (!hasPermission("salida.edit")) return;
    setSelectedSalida(salida);
    setDialogReadOnly(false);
    setDialogOpen(true);
  };

  const handleView = (salida: Salida) => {
    setSelectedSalida(salida);
    setDialogReadOnly(true);
    setDialogOpen(true);
  };

  const handlePdf = async (obj: Salida) => {
    const base64 = await certificatesService.getCertificadoSalidaPDF(obj.id);
    setBase64(base64);
    setSelectedSalida(obj);
    setDialogPdfOpen(true);
  }

  const handleToggleStatus = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas cambiar el estado de esta salida?")) {
      try {
        await salidaService.toggleSalidaStatus(id);
        toast({
          title: "Estado actualizado",
          description: "El estado de la salida ha sido actualizado",
        });
        loadData();
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo actualizar el estado",
          variant: "destructive",
        });
      }
    }
  };

  const openRatesDialog = () => setRatesDialogOpen(true);

  const formatPeso = (peso: number) => {
    return `${peso.toFixed(2)} kg`;
  };

  const columns: ColumnDef<Salida>[] = [
    {
      accessorKey: "fecha",
      header: "Fecha"
    },
    {
      accessorKey: "salida",
      header: "Salida"
    },
    {
      accessorKey: "destino",
      header: "Destino"
    },
    {
      accessorKey: "conductorNombre",
      header: "Conductor"
    },
    {
      accessorKey: "productoNombre",
      header: "Producto"
    },
    {
      accessorKey: "peso",
      header: "Peso",
      cell: ({ row }) => formatPeso(row.getValue("peso")),
    },
    {
      accessorKey: "activo",
      header: "Estado",
      cell: ({ row }) => {
        return (
          <Badge variant={row.getValue("activo") ? "default" : "secondary"}>
            {row.getValue("activo") ? "Activo" : "Inactivo"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const salida = row.original;
        return (
          <TooltipProvider>
            <div className="flex items-center space-x-2">
              {hasPermission("salida.edit") ? (
                <>
                  <ButtonTooltip variant="ghost" size="sm" onClick={() => handleEdit(salida)} tooltipContent="Editar">
                    <Edit className="h-4 w-4" />
                  </ButtonTooltip>
                  <ButtonTooltip variant="ghost" size="sm" onClick={() => handlePdf(salida)} tooltipContent="PDF">
                    <FileText className="h-4 w-4" />
                  </ButtonTooltip>
                  <ButtonTooltip variant="ghost" size="sm" onClick={() => handleToggleStatus(salida.id)}
                    tooltipContent={salida.activo ? "Desactivar" : "Activar"}
                    className={salida.activo ? "new-text-green-600" : "new-text-red-600"}
                  >
                    <PowerSquare className="h-4 w-4" />
                  </ButtonTooltip>
                </>
              ) : (
                <>
                  <ButtonTooltip variant="ghost" size="sm" onClick={() => handleView(salida)} tooltipContent="Ver">
                    <Eye className="h-4 w-4" />
                  </ButtonTooltip>
                </>
              )}
            </div>
          </TooltipProvider>
        );
      },
    },
  ];

  if (!hasPermission("salida.view")) {
    return <div className="p-8 text-center text-muted-foreground">No tienes permiso para ver las salidas.</div>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando salidas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Salidas</h1>
          <p className="text-gray-600">Gestiona las salidas de residuos</p>
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
            <div></div>
            <div className="flex items-center gap-2">
              {hasPermission("rates.edit") && (
                <Button onClick={openRatesDialog} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow">
                  <CircleDollarSign className="mr-2 h-4 w-4" />
                  Actualizar Tarifas
                </Button>
              )}
              {hasPermission("salida.edit") && (
                <Button onClick={handleCreate} className="bg-primary hover:bg-primary-hover">
                  <Plus className="mr-2 h-4 w-4" />Nueva Salida
                </Button>
              )}
            </div>
          </div>
          <DataTable
            columns={columns}
            data={salidas}
            searchKey={["fecha", "sedeNombre", "clienteNombre", "conductorNombre", "productoNombre"]}
            searchPlaceholder="Buscar ..."
          />
        </CardContent>
      </Card>

      <SalidaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        salida={selectedSalida}
        sedes={sedes}
        vehiculos={vehiculos}
        productos={productos}
        plantas={plantas}
        onSuccess={loadData}
        readOnly={dialogReadOnly}
        onVehiclesUpdate={loadData}
      />

      {base64 && (
        <PdfDialog
          open={dialogPdfOpen}
          onOpenChange={setDialogPdfOpen}
          base64={base64}
        />
      )}

      <UpdateRatesDialog
        open={ratesDialogOpen}
        onOpenChange={setRatesDialogOpen}
        tipo="salida"
      />
    </div>
  );
}
