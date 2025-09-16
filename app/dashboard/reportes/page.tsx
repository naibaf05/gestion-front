"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, Loader2, Download } from "lucide-react";
import { reportesService, type TipoReporte } from "@/services/reportesService";
import { GenericTableDialog } from "@/components/dialogs/GenericTableDialog";
import { ColumnDef } from "@tanstack/react-table";
import { set } from "date-fns";

export default function ReportesPage() {
    const [tipoReporte, setTipoReporte] = useState<TipoReporte | "">("");
    const [reporteNombre, setReporteNombre] = useState<string>("");
    const [fechaInicio, setFechaInicio] = useState(() => {
        const today = new Date();
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Bogota',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        return formatter.format(today);
    });
    const [fechaFin, setFechaFin] = useState(() => {
        const today = new Date();
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Bogota',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        return formatter.format(today);
    });
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const [dialogTableOpen, setDialogTableOpen] = useState(false);
    const [data, setData] = useState<any[]>([]);

    const tiposReporte = [
        { value: "reporte1", label: "Reporte Recolecciones y/o entregas en plantas (Residuos)" },
        { value: "reporte2", label: "Reporte Recolecciones y/o entregas en plantas (Llantas)" },
        { value: "reporte3", label: "Reporte Salidas" },
    ];

    const [exportColumns, setExportColumns] = useState<string[]>([]);
    const [exportHeaders, setExportHeaders] = useState<string[]>([]);
    const [searchKey, setSearchKey] = useState<string[]>([]);
    const [columns_table, setColumns_table] = useState<ColumnDef<any>[]>([]);

    const tableR1: ColumnDef<any>[] = [
        {
            accessorKey: "fecha",
            header: "Fecha",
        },
        {
            accessorKey: "planta",
            header: "Planta",
        },
        {
            accessorKey: "sede",
            header: "Sede",
        },
        {
            accessorKey: "nit",
            header: "NIT",
        },
        {
            accessorKey: "ciudad",
            header: "Ciudad",
        },
        {
            accessorKey: "direccion",
            header: "Dirección",
        },
        {
            accessorKey: "tipoResiduo",
            header: "Tipo Residuo",
        },
        {
            accessorKey: "cantidad",
            header: "Cantidad",
        },
        {
            accessorKey: "recolNombre",
            header: "Recolección",
        },
    ];

    const handleGenerar = async () => {
        if (!tipoReporte) {
            toast({
                title: "Error",
                description: "Debe seleccionar un tipo de reporte",
                variant: "error",
            });
            return;
        }

        if (!fechaInicio || !fechaFin) {
            toast({
                title: "Error",
                description: "Debe seleccionar las fechas de inicio y fin",
                variant: "error",
            });
            return;
        }

        if (new Date(fechaInicio) > new Date(fechaFin)) {
            toast({
                title: "Error",
                description: "La fecha de inicio no puede ser mayor que la fecha de fin",
                variant: "error",
            });
            return;
        }

        setLoading(true);

        try {
            let dataP: any[] = [];
            let exportCols: string[] = [];
            let exportHeads: string[] = [];
            let searchKey: string[] = [];
            const nombre = tiposReporte.find(r => r.value === tipoReporte)?.label || tipoReporte;
            setReporteNombre(nombre);

            // Llamar al servicio según el tipo de reporte
            switch (tipoReporte) {
                case "reporte1":
                    dataP = await reportesService.generarReporte1(fechaInicio, fechaFin);
                    exportCols = ["fecha", "planta", "sede", "nit", "ciudad", "direccion", "tipoResiduo", "cantidad", "recolNombre"];
                    exportHeads = ["Fecha", "Planta", "Sede", "NIT", "Ciudad", "Dirección", "Tipo Residuo", "Cantidad", "Recolección"];
                    searchKey = ["fecha", "planta", "sede", "nit", "ciudad", "direccion", "tipoResiduo", "cantidad", "recolNombre"];
                    setColumns_table(tableR1);
                    break;
                case "reporte2":
                    dataP = await reportesService.generarReporte2(fechaInicio, fechaFin);
                    exportCols = ["fecha", "planta", "sede", "nit", "ciudad", "direccion", "tipoResiduo", "cantidad", "recolNombre"];
                    exportHeads = ["Fecha", "Planta", "Sede", "NIT", "Ciudad", "Dirección", "Tipo Residuo", "Cantidad", "Recolección"];
                    searchKey = ["fecha", "planta", "sede", "nit", "ciudad", "direccion", "tipoResiduo", "cantidad", "recolNombre"];
                    setColumns_table(tableR1);
                    break;
                case "reporte3":
                    dataP = await reportesService.generarReporte3(fechaInicio, fechaFin);
                    exportCols = ["nombreSede", "direccionSede", "emailSede", "tipo_residuo", "tarifa", "fecha_inicio", "fecha_fin"];
                    exportHeads = ["Sede", "Dirección", "Email", "Tipo de Residuo", "Tarifa", "Fecha Inicio", "Fecha Fin"];
                    break;
                case "reporte4":
                    dataP = await reportesService.generarReporte4(fechaInicio, fechaFin);
                    break;
                default:
                    throw new Error("Tipo de reporte no válido");
            }
            setData(dataP);
            setExportColumns(exportCols);
            setExportHeaders(exportHeads);
            setSearchKey(searchKey);
            setDialogTableOpen(true);            

        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.message || "No se pudo generar el reporte",
                variant: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setTipoReporte("");
        const today = new Date();
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Bogota',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        const todayFormatted = formatter.format(today);
        setFechaInicio(todayFormatted);
        setFechaFin(todayFormatted);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
                    <p className="text-gray-600 mt-1">Genere y descargue reportes del sistema</p>
                </div>
            </div>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Generador de Reportes
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <Label htmlFor="tipoReporte">Tipo de Reporte</Label>
                            <Select
                                value={tipoReporte}
                                onValueChange={(value) => setTipoReporte(value as TipoReporte)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione un tipo de reporte" />
                                </SelectTrigger>
                                <SelectContent>
                                    {tiposReporte.map((tipo) => (
                                        <SelectItem key={tipo.value} value={tipo.value}>
                                            {tipo.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="fechaInicio">Fecha Inicio</Label>
                            <Input
                                id="fechaInicio"
                                type="date"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="fechaFin">Fecha Fin</Label>
                            <Input
                                id="fechaFin"
                                type="date"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={resetForm}
                            disabled={loading}
                        >
                            Limpiar
                        </Button>

                        <Button
                            onClick={handleGenerar}
                            disabled={loading || !tipoReporte}
                            className="bg-primary hover:bg-primary-hover"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {!loading && <Download className="mr-2 h-4 w-4" />}
                            {loading ? "Generando..." : "Generar Reporte"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <GenericTableDialog
                open={dialogTableOpen}
                onOpenChange={setDialogTableOpen}
                columns={columns_table}
                data={data}
                searchKey={searchKey}
                title={reporteNombre}
                exportColumns={exportColumns}
                exportHeaders={exportHeaders}
            />
        </div>
    );
}
