"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, MapPin, MapPinOff, PowerSquare, CalendarDays, CircleDollarSign, Trash2, History, Eye } from "lucide-react";
import { clientService } from "@/services/clientService";
import { pathService } from "@/services/pathService";
import { parametrizationService } from "@/services/parametrizationService";
import type { Sede, Cliente, Parametrizacion, Path, InfoAdicional } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { SedeDialog } from "@/components/dialogs/SedeDialog";
import type { ColumnDef } from "@tanstack/react-table";
import { LocationPickerDialog } from "@/components/dialogs/LocationPickerDialog";
import { WeeklyScheduleDialog } from "@/components/dialogs/WeeklyScheduleDialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { RatesDialog } from "@/components/dialogs/RatesDialog";
import { useAuth } from "@/contexts/AuthContext";
import { ButtonTooltip } from "@/components/ui/button-tooltip";
import { HistorialDialog } from "@/components/dialogs/HistorialDialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export default function SedesPage() {
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

  const { user, logout } = useAuth();

  const [sedes, setSedes] = useState<Sede[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [poblados, setPoblados] = useState<Parametrizacion[]>([]);
  const [oficinas, setOficinas] = useState<Parametrizacion[]>([]);
  const [generadores, setGeneradores] = useState<Parametrizacion[]>([]);
  const [periodos, setPeriodos] = useState<Parametrizacion[]>([]);
  const [mockScheduleItems, setMockScheduleItems] = useState<Path[]>([]);
  const [infoAdicional, setInfoAdicional] = useState<InfoAdicional>();

  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogReadOnly, setDialogReadOnly] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [locationReadOnly, setLocationReadOnly] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleReadOnly, setScheduleReadOnly] = useState(false);
  const [ratesDialogOpen, setRatesDialogOpen] = useState(false);
  const [ratesReadOnly, setRatesReadOnly] = useState(false);
  const [selectedSede, setSelectedSede] = useState<Sede | null>(null);
  const [historialOpen, setHistorialOpen] = useState(false);
  const [historialId, setHistorialId] = useState<string>("");
  const [historialLabel, setHistorialLabel] = useState<string>("");
  const { toast } = useToast();
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const searchParams = useSearchParams();

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  if (user && user.permisos && typeof user.permisos === "string") {
    user.permisos = JSON.parse(user.permisos);
  }

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permisos) return false
    if (user.rolNombre === "ADMIN") return true
    return user.permisos[permission] === true
  }

  useEffect(() => {
    loadData();
  }, []);

  // Efecto para detectar si se debe abrir el diálogo automáticamente
  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'create' && clientes.length > 0 && poblados.length > 0 && oficinas.length > 0 && generadores.length > 0 && periodos.length > 0) {
      handleCreate()
      // Limpiar el parámetro de la URL sin recargar la página
      window.history.replaceState({}, '', '/dashboard/sedes')
    }
  }, [searchParams, clientes, poblados, oficinas, generadores, periodos]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        sedesData,
        clientesData,
        pobladosData,
        oficinasData,
        generadoresData,
        periodosData,
        pathData,
        infoAdicionalData,
      ] = await Promise.all([
        clientService.getSedes(),
        clientService.getClientes(),
        parametrizationService.getListaActivos("poblado"),
        parametrizationService.getListaActivos("oficina"),
        parametrizationService.getListaActivos("generador"),
        parametrizationService.getListaActivos("periodo"),
        pathService.getAll(),
        pathService.getInfoAdicional(selectedDate),
      ]);
      setSedes(sedesData);
      setClientes(clientesData);
      setPoblados(pobladosData);
      setOficinas(oficinasData);
      setGeneradores(generadoresData);
      setPeriodos(periodosData);
      setMockScheduleItems(pathData);
      setInfoAdicional(infoAdicionalData);
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
    setSelectedSede(null);
    setDialogReadOnly(false);
    setDialogOpen(true);
  };

  const handleEdit = (sede: Sede) => {
    setSelectedSede(sede);
    setDialogReadOnly(false);
    setDialogOpen(true);
  };

  const handleView = (sede: Sede) => {
    setSelectedSede(sede);
    setDialogReadOnly(true);
    setDialogOpen(true);
  }

  const handleToggleStatus = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas cambiar el estado a esta sede?")) {
      try {
        await clientService.toggleSedeStatus(id);
        toast({
          title: "Estado actualizado",
          description: "El estado de la sede ha sido actualizado",
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

  const handleHistorial = (id: string, nombre: string, clienteNombre: string) => {
    setHistorialId(id);
    setHistorialLabel(`Sede [${nombre} - ${clienteNombre}]`);
    setHistorialOpen(true);
  };

  const handleLocationConfirm = (
    lat: number,
    lng: number,
    address?: string
  ) => {
    let sede = selectedSede;
    if (sede) {
      sede.lat = lat;
      sede.lon = lng;
      setSelectedSede(sede);
      clientService.updateCoord(sede.id, sede);
    }
    toast({
      title: "Ubicación seleccionada",
      description: "La ubicación ha sido establecida correctamente",
    });
  };

  const openLocationPicker = (sede: Sede) => {
    setSelectedSede(sede);
    // Solo lectura si no tiene permiso de geo.edit
    setLocationReadOnly(!hasPermission("geo.edit"));
    setLocationDialogOpen(true);
  };

  const openScheduleDialog = (sede: Sede) => {
    setSelectedSede(sede);
    setScheduleData(sede.frecuencias || []);
    setScheduleReadOnly(!hasPermission("schedule.edit"));
    setScheduleDialogOpen(true)
  }

  const openRatesDialog = (sede: Sede) => {
    setSelectedSede(sede);
    setRatesReadOnly(!hasPermission("rates.edit"));
    setRatesDialogOpen(true);
  }

  const handleScheduleSave = async (schedule: any[]) => {
    try {
      if (selectedSede) {
        await pathService.createFrecuencias(schedule, selectedSede.id);
        toast({
          title: "Frecuencia guardada",
          description: `Se configuraron ${schedule.length} asignaciones en el horario`,
        })
        loadData();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  }

  const columns: ColumnDef<Sede>[] = [
    {
      accessorKey: "nombre",
      header: "Nombre",
      width: "20%",
    },
    {
      accessorKey: "clienteNombre",
      header: "Cliente",
      width: "20%",
    },
    {
      accessorKey: "direccion",
      header: "Dirección",
      width: "20%",
    },
    {
      accessorKey: "telefono",
      header: "Teléfono",
      width: "15%",
    },
    {
      accessorKey: "email",
      header: "Email",
      width: "20%",
    },
    {
      accessorKey: "poblado",
      header: "Municipio",
      width: "15%",
      cell: ({ row }) => {
        const poblado = poblados.find((p) => p.id === row.original.pobladoId);
        return poblado?.nombre || "N/A";
      },
    },
    {
      accessorKey: "activo",
      header: "Estado",
      width: "8%",
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
      width: "20%",
      cell: ({ row }) => {
        const sede = row.original;
        return (
          <TooltipProvider>
            <div className="flex items-center space-x-2">
              {hasPermission("sedes.edit") ? (
                <>
                  <ButtonTooltip variant="ghost" size="sm" onClick={() => handleEdit(sede)} tooltipContent="Editar">
                    <Edit className="h-4 w-4" />
                  </ButtonTooltip>
                  <ButtonTooltip variant="ghost" size="sm" onClick={() => handleToggleStatus(sede.id)}
                    tooltipContent={sede.activo ? "Desactivar" : "Activar"} className={sede.activo ? "new-text-green-600" : "new-text-red-600"}>
                    <PowerSquare className="h-4 w-4" />
                  </ButtonTooltip>
                </>
              ) : hasPermission("sedes.view") && (
                <ButtonTooltip variant="ghost" size="sm" onClick={() => handleView(sede)} tooltipContent="Ver">
                  <Eye className="h-4 w-4" />
                </ButtonTooltip>
              )}
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
                  {hasPermission("sedes.edit") && (
                    <DropdownMenuItem onClick={() => handleDelete(sede)}
                      className="new-text-red-600">
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  )}
                  {hasPermission("schedule.view") && (
                    <DropdownMenuItem onClick={() => openScheduleDialog(sede)}>
                      <CalendarDays className="h-4 w-4" />
                      Frecuencias
                    </DropdownMenuItem>
                  )}
                  {hasPermission("geo.view") && (
                    <DropdownMenuItem onClick={() => openLocationPicker(sede)}>
                      {sede.lat ? (
                        <MapPin className="h-4 w-4 new-text-green-600" />
                      ) : (
                        <MapPinOff className="h-4 w-4 new-text-red-600" />
                      )}
                      Ubicación
                    </DropdownMenuItem>
                  )}
                  {hasPermission("rates.view") && (
                    <DropdownMenuItem onClick={() => openRatesDialog(sede)}>
                      <CircleDollarSign className="h-4 w-4" />
                      Tarifas
                    </DropdownMenuItem>
                  )}
                  {hasPermission("users.historial") && (
                    <DropdownMenuItem onClick={() => handleHistorial(sede.id, sede.nombre, sede.clienteNombre)}>
                      <History className="h-4 w-4" />
                      Historial
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TooltipProvider>
        );
      },
    },
  ];

  const handleDelete = (sede: Sede) => {
    setSelectedSede(sede)
    setConfirmDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedSede) return

    try {
      await clientService.deleteSede(selectedSede.id);
      toast({
        title: "Sede eliminada",
        description: "La sede ha sido eliminada exitosamente",
        variant: "success",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: (error && error.message ? error.message : "No se pudo eliminar la sede"),
        variant: "destructive",
      });
    } finally {
      setSelectedSede(null)
    }
  }

  const cancelDelete = () => {
    setSelectedSede(null)
  }

  if (!hasPermission("sedes.view")) {
    return <div className="p-8 text-center text-muted-foreground">No tienes permiso para ver sedes.</div>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando sedes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sedes</h1>
          <p className="text-gray-600">Gestiona las sedes de los clientes</p>
        </div>
        {hasPermission("sedes.edit") && (
          <Button onClick={handleCreate} className="bg-primary hover:bg-primary-hover">
            <Plus className="mr-2 h-4 w-4" />Nueva Sede
          </Button>
        )}
      </div>

      <Card>
        <CardContent>
          <DataTable
            columns={columns}
            data={sedes}
            layoutMode="fixed"
            searchKey={["nombre", "clienteNombre", "direccion"]}
            searchPlaceholder="Buscar por nombre..."
          />
        </CardContent>
      </Card>

      <SedeDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) setDialogReadOnly(false)
          setDialogOpen(open)
        }}
        sede={selectedSede}
        clientes={clientes}
        poblados={poblados}
        oficinas={oficinas}
        generadores={generadores}
        periodos={periodos}
        onSuccess={loadData}
        readOnly={dialogReadOnly}
      />

      <LocationPickerDialog
        open={locationDialogOpen}
        onOpenChange={(open) => {
          if (!open) setLocationReadOnly(false);
          setLocationDialogOpen(open);
        }}
        title="Seleccionar Ubicación de la Sede"
        description="Busca la dirección o haz clic en el mapa para establecer la ubicación exacta de la sede"
        initialLat={selectedSede?.lat}
        initialLng={selectedSede?.lon}
        onLocationConfirm={handleLocationConfirm}
        readOnly={locationReadOnly}
      />

      {/* Diálogo de horario semanal */}
      <WeeklyScheduleDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        title="Frecuencia de Recolección Semanal"
        description="Configura los frecuencia de recolección para cada día de la semana"
        availableItems={mockScheduleItems}
        initialSchedule={scheduleData}
        infoAdicional={infoAdicional}
        onSave={handleScheduleSave}
        readOnly={scheduleReadOnly}
      />

      <RatesDialog
        open={ratesDialogOpen}
        onOpenChange={(open) => {
          if (!open) setRatesReadOnly(false);
          setRatesDialogOpen(open);
        }}
        sede={selectedSede}
        readOnly={ratesReadOnly}
        canEdit={hasPermission("rates.edit")}
      />

      <ConfirmationDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Eliminar"
        description="¿Estás seguro de que deseas eliminar esta sede?"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      <HistorialDialog
        open={historialOpen}
        onOpenChange={setHistorialOpen}
        tipo="Sede"
        id={historialId}
        label={historialLabel}
      />
    </div>
  );
}
