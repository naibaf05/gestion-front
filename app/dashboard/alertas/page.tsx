"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Edit } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import type { ColumnDef } from "@tanstack/react-table";
import type { AlertaVehiculo } from "@/types";
import { alertService } from "@/services/alertService";
import { AlertaDialog } from "@/components/dialogs/AlertaDialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ButtonTooltip } from "@/components/ui/button-tooltip";
import { useAuth } from "@/contexts/AuthContext";

export default function AlertasPage() {
    const { user, logout } = useAuth();

    const [alertasSoat, setAlertasSoat] = useState<AlertaVehiculo[]>([]);
    const [alertasTecnomecanica, setAlertasTecnomecanica] = useState<AlertaVehiculo[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedAlerta, setSelectedAlerta] = useState<AlertaVehiculo | null>(null);
    const [tipoAlerta, setTipoAlerta] = useState<"soat" | "tecnomecanica">("soat");
    const [tab, setTab] = useState("soat");
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
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [soatData, tecnomecanicaData] = await Promise.all([
                alertService.getAlertasSoat(),
                alertService.getAlertasTecnomecanica(),
            ]);
            setAlertasSoat(soatData);
            setAlertasTecnomecanica(tecnomecanicaData);
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudieron cargar las alertas",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSuccess = () => {
        loadData();
        window.dispatchEvent(new Event('alertas-updated'));
    };

    const handleEdit = (alerta: AlertaVehiculo, tipo: "soat" | "tecnomecanica") => {
        setSelectedAlerta(alerta);
        setTipoAlerta(tipo);
        setDialogOpen(true);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString("es-CO", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
    };

    const columnsSoat: ColumnDef<AlertaVehiculo>[] = [
        {
            accessorKey: "placa",
            header: "Placa",
            cell: ({ row }) => row.original.placa || "-",
        },
        {
            accessorKey: "conductorNombre",
            header: "Conductor",
            cell: ({ row }) => row.original.conductorNombre || "-",
        },
        {
            accessorKey: "fechaSoat",
            header: "Fecha SOAT",
        },
        {
            id: "actions",
            header: "Acciones",
            cell: ({ row }) => (
                <TooltipProvider>
                    {hasPermission("alerts.edit") && (
                        <ButtonTooltip
                            tooltipContent="Editar"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(row.original, "soat")}
                        >
                            <Edit className="h-4 w-4" />
                        </ButtonTooltip>
                    )}
                </TooltipProvider>
            ),
        },
    ];

    const columnsTecnomecanica: ColumnDef<AlertaVehiculo>[] = [
        {
            accessorKey: "placa",
            header: "Placa",
            cell: ({ row }) => row.original.placa || "-",
        },
        {
            accessorKey: "conductorNombre",
            header: "Conductor",
            cell: ({ row }) => row.original.conductorNombre || "-",
        },
        {
            accessorKey: "fechaTecnomecanica",
            header: "Fecha Tecnomecánica",
        },
        {
            id: "actions",
            header: "Acciones",
            cell: ({ row }) => (
                <TooltipProvider>
                    {hasPermission("alerts.edit") && (
                        <ButtonTooltip
                            tooltipContent="Editar"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(row.original, "tecnomecanica")}
                        >
                            <Edit className="h-4 w-4" />
                        </ButtonTooltip>
                    )}
                </TooltipProvider>
            ),
        },
    ];

    if (!hasPermission("alerts.view")) {
        return <div className="p-8 text-center text-muted-foreground">No tienes permiso para ver las alertas.</div>
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Alertas</h1>
                    <p className="text-muted-foreground">
                        Gestión de alertas
                    </p>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-2">
                    Total: {alertasSoat.length + alertasTecnomecanica.length}
                </Badge>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <Tabs value={tab} onValueChange={setTab}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="soat" className="relative">
                                SOAT
                                {alertasSoat.length > 0 && (
                                    <Badge
                                        variant="destructive"
                                        className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                                    >
                                        {alertasSoat.length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="tecnomecanica" className="relative">
                                Tecnomecánica
                                {alertasTecnomecanica.length > 0 && (
                                    <Badge
                                        variant="destructive"
                                        className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                                    >
                                        {alertasTecnomecanica.length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="soat" className="mt-4">
                            <DataTable
                                columns={columnsSoat}
                                data={alertasSoat}
                            />
                        </TabsContent>

                        <TabsContent value="tecnomecanica" className="mt-4">
                            <DataTable
                                columns={columnsTecnomecanica}
                                data={alertasTecnomecanica}
                            />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <AlertaDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                alerta={selectedAlerta}
                tipo={tipoAlerta}
                onSuccess={handleSuccess}
            />
        </div>
    );
}
