"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Edit, FileSpreadsheet, Plus, Trash2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ProgDialog } from "@/components/dialogs/ProgDialog";
import type { ColumnDef } from "@tanstack/react-table";
import { pathService } from "@/services/pathService";
import { progService } from "@/services/progService";
import { InfoAdicional, Path, ProgEvPath, ProgPath, Sede, Vehicle, ProgRutas } from "@/types";
import { vehicleService } from "@/services/vehicleService";
import { ProgEvDialog } from "@/components/dialogs/ProgEvDialog";
import { clientService } from "@/services/clientService";
import { GenericTableDialog } from "@/components/dialogs/GenericTableDialog";
import { WeekPicker } from "@/components/ui/week-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { ButtonTooltip } from "@/components/ui/button-tooltip";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export default function ProgsPage() {
  const { user, logout } = useAuth();

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
  const [isWeekMode, setIsWeekMode] = useState(false);
  const [tab, setTab] = useState("tabla");
  const [tabla, setTabla] = useState<ProgPath[]>([]);
  const [tablaEventual, setTablaEventual] = useState<ProgEvPath[]>([]);
  const [infoAdicional, setInfoAdicional] = useState<InfoAdicional>();
  const [vehiculos, setVehiculos] = useState<Vehicle[]>([]);
  const [rutas, setRutas] = useState<Path[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [progRutas, setProgRutas] = useState<ProgRutas[]>([]);

  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogEvOpen, setDialogEvOpen] = useState(false);
  const [dialogTableOpen, setDialogTableOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ProgPath | null>(null);
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
    loadData();
  }, [selectedDate, isWeekMode]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [data1, data2, infoAdicionalData, vehiclesData, pathData, sedesData] = await Promise.all([
        progService.getData(selectedDate, isWeekMode),
        progService.getDataEv(selectedDate, isWeekMode),
        pathService.getInfoAdicional(selectedDate),
        vehicleService.getVehiclesActivos(),
        pathService.getRutasDia(selectedDate),
        clientService.getSedesActivas()
      ]);
      setTabla(data1);
      setTablaEventual(data2);
      setInfoAdicional(infoAdicionalData);
      setVehiculos(vehiclesData);
      setRutas(pathData);
      setSedes(sedesData);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEv = () => {
    setSelectedItem(null);
    setDialogEvOpen(true);
  };

  const handleEdit = (item: ProgPath) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const openTableDialog = async (item: ProgPath) => {
    const dataRutas = await progService.getDataRutas(selectedDate, item.rutaId);
    setSelectedItem(item);
    setProgRutas(dataRutas);
    setDialogTableOpen(true);
  }

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [eventualToDelete, setEventualToDelete] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setEventualToDelete(id);
    setConfirmDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!eventualToDelete) return;
    try {
      await progService.deleteEv(eventualToDelete);
      toast({
        title: "Eliminar",
        description: "La programación eventual ha sido eliminada correctamente",
        variant: "success"
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar",
        variant: "error",
      });
    } finally {
      setEventualToDelete(null);
      setConfirmDialogOpen(false);
    }
  };

  const cancelDelete = () => {
    setEventualToDelete(null);
    setConfirmDialogOpen(false);
  };

  const columns: ColumnDef<ProgPath>[] = [
    {
      accessorKey: "rutaNombre",
      header: "Ruta",
      width: "200px",
    },
    {
      accessorKey: "planta",
      header: "Planta",
      width: "350px",
    },
    {
      accessorKey: "vehiculoInterno",
      header: "Vehículo",
      width: "150px",
    },
    {
      id: "actions",
      header: "Acciones",
      width: "160px",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <TooltipProvider>
            <div className="flex items-center space-x-2">
              {hasPermission("prog.edit") && (
                <ButtonTooltip variant="ghost" size="sm" onClick={() => handleEdit(item)} tooltipContent="Editar">
                  <Edit className="h-4 w-4" />
                </ButtonTooltip>
              )}
              <ButtonTooltip variant="ghost" size="sm" onClick={() => openTableDialog(item)} tooltipContent="Ver Programación">
                <FileSpreadsheet className="h-4 w-4" />
              </ButtonTooltip>
            </div>
          </TooltipProvider>
        );
      },
    },
  ];

  const columns_ev: ColumnDef<ProgEvPath>[] = [
    {
      accessorKey: "sedeNombre",
      header: "Sede",
      width: "350px",
    },
    {
      accessorKey: "rutaNombre",
      header: "Ruta",
      width: "200px",
    },
    {
      accessorKey: "vehInterno",
      header: "Vehículo",
      width: "150px",
    },
    {
      id: "actions",
      header: "Acciones",
      width: "100px",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <TooltipProvider>
            <div className="flex items-center space-x-2">
              {hasPermission("prog.edit") && (
                <ButtonTooltip variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="new-text-red-600" tooltipContent="Eliminar">
                  <Trash2 className="h-4 w-4" />
                </ButtonTooltip>
              )}
            </div>
          </TooltipProvider>
        );
      },
    },
  ];

  const columns_table: ColumnDef<ProgRutas>[] = [
    {
      accessorKey: "tipo",
      header: "Tipo",
    },
    {
      accessorKey: "sedeNombre",
      header: "Sede",
    },
    {
      accessorKey: "sedeDireccion",
      header: "Dirección",
    },
    {
      accessorKey: "sedeBarrio",
      header: "Barrio",
    },
    {
      accessorKey: "rutaNombre",
      header: "Ruta",
    },
    {
      accessorKey: "sedeLat",
      header: "Coordenadas",
      cell: ({ row }) => {
        return row.original?.sedeLat ? "SI" : "NO";
      },
    }
  ];

  if (!hasPermission("prog.view")) {
    return <div className="p-8 text-center text-muted-foreground">No tienes permiso para ver la programación.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Programación</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="week-mode"
              checked={isWeekMode}
              onCheckedChange={(checked) => setIsWeekMode(checked === true)}
            />
            <Label htmlFor="week-mode" className="text-sm font-medium">
              Selección por semana
            </Label>
          </div>

          {isWeekMode ? (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Semana {infoAdicional?.semanaActual}</label>
              <WeekPicker
                value={selectedDate}
                onChange={setSelectedDate}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <label htmlFor="fecha" className="text-sm font-medium">Semana {infoAdicional?.semanaActual}</label>
              <input
                id="fecha"
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      </div>
      <Card>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="tabla">Por Ruta</TabsTrigger>
              <TabsTrigger value="tablaEventual">Eventuales</TabsTrigger>
            </TabsList>
            <TabsContent value="tabla">
              <DataTable columns={columns} data={tabla} searchKey="nombre" searchPlaceholder="Buscar por nombre..." />
            </TabsContent>
            <TabsContent value="tablaEventual">
              <div className="flex justify-between items-center">
                <div></div>
                {hasPermission("prog.edit") && (
                  <Button onClick={handleCreateEv} className="bg-primary hover:bg-primary-hover">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Eventual
                  </Button>
                )}
              </div>
              <DataTable columns={columns_ev} data={tablaEventual} searchKey="nombre" searchPlaceholder="Buscar por nombre..." />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <ProgDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={selectedItem}
        vehiculos={vehiculos}
        selectedDate={selectedDate}
        onSuccess={loadData}
      />

      <ProgEvDialog
        open={dialogEvOpen}
        onOpenChange={setDialogEvOpen}
        rutas={rutas}
        sedes={sedes}
        selectedDate={selectedDate}
        onSuccess={loadData}
      />

      <GenericTableDialog
        open={dialogTableOpen}
        onOpenChange={setDialogTableOpen}
        columns={columns_table}
        data={progRutas}
        searchKey={["tipo", "sedeNombre", "sedeDireccion"]}
        title="Programación Ruta"
        exportColumns={["tipo", "sedeNombre", "sedeDireccion", "sedeBarrio", "rutaNombre", "sedeLat"]}
        exportHeaders={["Tipo", "Sede", "Dirección", "Barrio", "Ruta", "Coordenadas"]}
        maxWidth="60vw"
      />

      <ConfirmationDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Eliminar programación eventual"
        description="¿Estás seguro de que deseas eliminar la programación eventual?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        variant="destructive"
      />
    </div>
  );
}
