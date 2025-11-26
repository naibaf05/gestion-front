"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, PowerSquare, Paperclip, History, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import type { ColumnDef } from "@tanstack/react-table";
import type { Parametrizacion, User, Vehicle } from "@/types";
import { vehicleService } from "@/services/vehicleService";
import { VehicleDialog } from "@/components/dialogs/VehicleDialog";
import { parametrizationService } from "@/services/parametrizationService";
import { userService } from "@/services/userService";
import { AdjuntosDialog } from "@/components/dialogs/AdjuntosDialog";
import { HistorialDialog } from "@/components/dialogs/HistorialDialog";
import { ButtonTooltip } from "@/components/ui/button-tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export default function VehiclesPage() {
    const { user, logout } = useAuth();

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [dialogReadOnly, setDialogReadOnly] = useState(false);
    const [oficinas, setOficinas] = useState<Parametrizacion[]>([]);
    const [conductores, setConductores] = useState<User[]>([]);
    const [tiposVehiculo, setTiposVehiculo] = useState<Parametrizacion[]>([]);
    const { toast } = useToast();

    const [adjuntosOpen, setAdjuntosOpen] = useState(false);
    const [entidadId, setEntidadId] = useState<string | null>(null);

    const [historialOpen, setHistorialOpen] = useState(false);
    const [historialId, setHistorialId] = useState<string>("");
    const [historialLabel, setHistorialLabel] = useState<string>("");
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [vehicleToToggle, setVehicleToToggle] = useState<string | null>(null);

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
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [vehiclesData, oficinasData, conductoresData, tiposVehiculoData] = await Promise.all([
                vehicleService.getVehicles(),
                parametrizationService.getListaActivos("oficina"),
                userService.getUsersActivos(),
                parametrizationService.getListaActivos("t_vehiculo"),
            ]);
            setVehicles(vehiclesData);
            setOficinas(oficinasData);
            setConductores(conductoresData);
            setTiposVehiculo(tiposVehiculoData);
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
        setSelectedVehicle(null);
        setDialogReadOnly(false);
        setDialogOpen(true);
    };

    const handleEdit = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle);
        setDialogReadOnly(false);
        setDialogOpen(true);
    };

    const handleView = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle);
        setDialogReadOnly(true);
        setDialogOpen(true);
    };

    const handleToggleStatus = (id: string) => {
        setVehicleToToggle(id);
        setConfirmDialogOpen(true);
    };

    const confirmToggleStatus = async () => {
        if (!vehicleToToggle) return;
        try {
            await vehicleService.toggleVehicleStatus(vehicleToToggle);
            toast({
                title: "Estado actualizado",
                description: "El estado del vehículo ha sido actualizado",
                variant: "success",
            });
            loadData();
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo actualizar el estado",
                variant: "destructive",
            });
        } finally {
            setVehicleToToggle(null);
            setConfirmDialogOpen(false);
        }
    };

    const cancelToggleStatus = () => {
        setVehicleToToggle(null);
        setConfirmDialogOpen(false);
    };

    const handleAdjuntos = (id: string) => {
        setEntidadId(id);
        setAdjuntosOpen(true);
    };

    const handleHistorial = (id: string, placa: string) => {
        setHistorialId(id);
        setHistorialLabel(`Vehículo [${placa}]`);
        setHistorialOpen(true);
    };

    const columns: ColumnDef<Vehicle>[] = [
        {
            width: "350px",
            accessorKey: "oficinaNombre",
            header: "Planta",
        },
        {
            width: "100px",
            accessorKey: "interno",
            header: "Interno",
        },
        {
            width: "100px",
            accessorKey: "placa",
            header: "Placa",
        },
        {
            width: "200px",
            accessorKey: "conductorNombre",
            header: "Conductor",
        },
        {
            width: "100px",
            accessorKey: "activo",
            header: "Estado",
            cell: ({ row }) => (
                <Badge variant={row.getValue("activo") ? "default" : "secondary"}>
                    {row.getValue("activo") ? "Activo" : "Inactivo"}
                </Badge>
            ),
        },
        {
            width: "180px",
            id: "actions",
            header: "Acciones",
            cell: ({ row }) => {
                const veh = row.original;
                return (
                    <TooltipProvider>
                        <div className="flex items-center space-x-2">
                            {hasPermission("vehicles.edit") ?
                                <ButtonTooltip variant="ghost" size="sm" onClick={() => handleEdit(veh)} tooltipContent="Editar">
                                    <Edit className="h-4 w-4" />
                                </ButtonTooltip>
                                :
                                <ButtonTooltip variant="ghost" size="sm" onClick={() => handleView(veh)} tooltipContent="Ver">
                                    <Eye className="h-4 w-4" />
                                </ButtonTooltip>
                            }
                            {hasPermission("vehicles.edit") && (
                                <ButtonTooltip variant="ghost" size="sm" onClick={() => handleToggleStatus(veh.id)}
                                    className={veh.activo ? "new-text-green-600" : "new-text-red-600"}
                                    tooltipContent={veh.activo ? "Desactivar" : "Activar"}
                                >
                                    <PowerSquare className="h-4 w-4" />
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
                                    {hasPermission("profiles.permissions") && (
                                        <DropdownMenuItem onClick={() => handleAdjuntos(veh.id)}>
                                            <Paperclip className="h-4 w-4" />
                                            Adjuntos
                                        </DropdownMenuItem>
                                    )}
                                    {hasPermission("users.historial") && (
                                        <DropdownMenuItem onClick={() => handleHistorial(veh.id, veh.placa)}>
                                            <History className="h-4 w-4" />
                                            Historial
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </TooltipProvider >
                );
            },
        },
    ];

    if (!hasPermission("vehicles.view")) {
        return <div className="p-8 text-center text-muted-foreground">No tienes permiso para ver vehículos.</div>
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Cargando vehículos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Vehículos</h1>
                    <p className="text-gray-600">Gestiona los vehículos del sistema</p>
                </div>
                {hasPermission("vehicles.edit") && (
                    <Button onClick={handleCreate} className="bg-primary hover:bg-primary-hover">
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Vehículo
                    </Button>
                )}
            </div>

            <Card>
                <CardContent>
                    <DataTable columns={columns} data={vehicles} searchKey={["oficinaNombre", "interno", "placa", "conductorNombre"]} searchPlaceholder="Buscar ..." />
                </CardContent>
            </Card>

            <VehicleDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                vehicle={selectedVehicle}
                oficinas={oficinas}
                conductores={conductores}
                tiposVehiculo={tiposVehiculo}
                onSuccess={loadData}
                readOnly={dialogReadOnly}
            />

            <AdjuntosDialog
                open={adjuntosOpen}
                onOpenChange={setAdjuntosOpen}
                tipo="vehiculos"
                entityId={entidadId || ""}
                title="Adjuntos"
            />

            <HistorialDialog
                open={historialOpen}
                onOpenChange={setHistorialOpen}
                tipo="Vehiculo"
                id={historialId}
                label={historialLabel}
            />

            <ConfirmationDialog
                open={confirmDialogOpen}
                onOpenChange={setConfirmDialogOpen}
                title="Cambiar estado del vehículo"
                description="¿Estás seguro de que deseas cambiar el estado de este vehículo?"
                confirmText="Cambiar Estado"
                cancelText="Cancelar"
                onConfirm={confirmToggleStatus}
                onCancel={cancelToggleStatus}
                variant="default"
            />
        </div>
    );
}
