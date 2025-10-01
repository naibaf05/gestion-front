"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, MapPin, MapPinOff, PowerSquare, CalendarDays, CircleDollarSign } from "lucide-react";
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
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { RatesDialog } from "@/components/dialogs/RatesDialog";
import { useAuth } from "@/contexts/AuthContext";
import { ButtonTooltip } from "@/components/ui/button-tooltip";

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
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [ratesDialogOpen, setRatesDialogOpen] = useState(false);
  const [selectedSede, setSelectedSede] = useState<Sede | null>(null);
  const { toast } = useToast();
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const searchParams = useSearchParams();

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
    setDialogOpen(true);
  };

  const handleEdit = (sede: Sede) => {
    setSelectedSede(sede);
    setDialogOpen(true);
  };

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
    setLocationDialogOpen(true);
  };

  const openScheduleDialog = (sede: Sede) => {
    setSelectedSede(sede);
    setScheduleData(sede.frecuencias || []);
    setScheduleDialogOpen(true)
  }

  const openRatesDialog = (sede: Sede) => {
    setSelectedSede(sede);
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
    },
    {
      accessorKey: "clienteNombre",
      header: "Cliente",
    },
    {
      accessorKey: "direccion",
      header: "Dirección",
    },
    {
      accessorKey: "telefono",
      header: "Teléfono",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "poblado",
      header: "Municipio",
      cell: ({ row }) => {
        const poblado = poblados.find((p) => p.id === row.original.pobladoId);
        return poblado?.nombre || "N/A";
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
        );
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const sede = row.original;
        return (
          <TooltipProvider>
            <div className="flex items-center space-x-2">
              {hasPermission("sedes.edit") && (
                <>
                  <ButtonTooltip variant="ghost" size="sm" onClick={() => handleEdit(sede)} tooltipContent="Editar">
                    <Edit className="h-4 w-4" />
                  </ButtonTooltip>
                  <ButtonTooltip variant="ghost" size="sm" onClick={() => handleToggleStatus(sede.id)}
                    tooltipContent={sede.activo ? "Desactivar" : "Activar"} className={sede.activo ? "new-text-green-600" : "new-text-red-600"}>
                    <PowerSquare className="h-4 w-4" />
                  </ButtonTooltip>
                </>
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
                  {hasPermission("schedule.view") && (
                    <DropdownMenuItem onClick={() => openScheduleDialog(sede)}>
                      <CalendarDays className="h-4 w-4 mr-2" />
                      Frecuencias
                    </DropdownMenuItem>
                  )}
                  {hasPermission("geo.view") && (
                    <DropdownMenuItem onClick={() => openLocationPicker(sede)}>
                      {sede.lat ? (
                        <MapPin className="h-4 w-4 mr-2 new-text-green-600" />
                      ) : (
                        <MapPinOff className="h-4 w-4 mr-2 new-text-red-600" />
                      )}
                      Ubicación
                    </DropdownMenuItem>
                  )}
                  {hasPermission("rates.view") && (
                    <DropdownMenuItem onClick={() => openRatesDialog(sede)}>
                      <CircleDollarSign className="h-4 w-4 mr-2" />
                      Tarifas
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
            searchKey={["nombre", "clienteNombre", "direccion"]}
            searchPlaceholder="Buscar por nombre..."
          />
        </CardContent>
      </Card>

      <SedeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        sede={selectedSede}
        clientes={clientes}
        poblados={poblados}
        oficinas={oficinas}
        generadores={generadores}
        periodos={periodos}
        onSuccess={loadData}
      />

      <LocationPickerDialog
        open={locationDialogOpen}
        onOpenChange={setLocationDialogOpen}
        title="Seleccionar Ubicación de la Sede"
        description="Busca la dirección o haz clic en el mapa para establecer la ubicación exacta de la sede"
        initialLat={selectedSede?.lat}
        initialLng={selectedSede?.lon}
        onLocationConfirm={handleLocationConfirm}
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
      />

      <RatesDialog
        open={ratesDialogOpen}
        onOpenChange={setRatesDialogOpen}
        sede={selectedSede}
      />
    </div>
  );
}
