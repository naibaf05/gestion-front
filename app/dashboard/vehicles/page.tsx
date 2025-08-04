"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, PowerSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ColumnDef } from "@tanstack/react-table";
import type { Parametrizacion, User, Vehicle } from "@/types";
import { vehicleService } from "@/services/vehicleService";
import { VehicleDialog } from "@/components/dialogs/VehicleDialog";
import { parametrizationService } from "@/services/parametrizationService";
import { userService } from "@/services/userService";

export default function VehiclesPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [oficinas, setOficinas] = useState<Parametrizacion[]>([]);
    const [conductores, setConductores] = useState<User[]>([]);
    const [tiposVehiculo, setTiposVehiculo] = useState<Parametrizacion[]>([]);
    const { toast } = useToast();

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
        setDialogOpen(true);
    };

    const handleEdit = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle);
        setDialogOpen(true);
    };

    const handleToggleStatus = async (id: string) => {
        if (confirm("¿Estás seguro de que deseas cambiar el estado de este vehículo?")) {
            try {
                await vehicleService.toggleVehicleStatus(id);
                toast({
                    title: "Estado actualizado",
                    description: "El estado del vehículo ha sido actualizado",
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

    const columns: ColumnDef<Vehicle>[] = [
        {
            accessorKey: "planta.nombre",
            header: "Planta",
            cell: ({ row }) => row.original.oficinaNombre || "-",
        },
        {
            accessorKey: "interno",
            header: "Interno",
        },
        {
            accessorKey: "placa",
            header: "Placa",
        },
        {
            accessorKey: "conductor.nombre",
            header: "Conductor",
            cell: ({ row }) => row.original.conductorNombre || "-",
        },
        {
            accessorKey: "activo",
            header: "Estado",
            cell: ({ row }) => (
                <Badge variant={row.getValue("activo") ? "default" : "secondary"}>
                    {row.getValue("activo") ? "Activo" : "Inactivo"}
                </Badge>
            ),
        },
        {
            id: "actions",
            header: "Acciones",
            cell: ({ row }) => {
                const veh = row.original;
                return (
                    <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(veh)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(veh.id)}
                            className={veh.activo ? "new-text-green-600" : "new-text-red-600"}
                        >
                            <PowerSquare className="h-4 w-4" />
                        </Button>
                    </div>
                );
            },
        },
    ];

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
                <Button onClick={handleCreate} className="bg-primary hover:bg-primary-hover">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Vehículo
                </Button>
            </div>

            <Card>
                <CardContent>
                    <DataTable columns={columns} data={vehicles} searchKey="placa" searchPlaceholder="Buscar por placa..." />
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
            />
        </div>
    );
}
