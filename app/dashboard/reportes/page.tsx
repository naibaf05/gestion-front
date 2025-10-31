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
import { FileText, Loader2, Download, Settings } from "lucide-react";
import { reportesService, type TipoReporte } from "@/services/reportesService";
import { GenericTableDialog } from "@/components/dialogs/GenericTableDialog";
import { ColumnDef } from "@tanstack/react-table";
import { set } from "date-fns";
import { ReportDialog } from "@/components/dialogs/ReportDialog";
import { ColumnConfigDialog } from "@/components/dialogs/ColumnConfigDialog";

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
    const [columnConfigOpen, setColumnConfigOpen] = useState(false);
    const [availableColumns, setAvailableColumns] = useState<any[]>([]);

    // Configuración de columnas por tipo de reporte
    const getColumnConfig = (tipoReporte: TipoReporte) => {
        const baseColumns = [
            { key: "fecha", label: "Fecha", category: "cliente", enabled: true },
            { key: "nit", label: "NIT", category: "cliente", enabled: true },
            { key: "ciudad", label: "Ciudad", category: "cliente", enabled: true },
            { key: "numFactura", label: "Número de Factura", category: "cliente", enabled: true },
            { key: "valor", label: "Valor Facturado", category: "cliente", enabled: true },
            { key: "planta", label: "Planta", category: "sede", enabled: true },
            { key: "sede", label: "Sede", category: "sede", enabled: true },
            { key: "direccion", label: "Dirección", category: "sede", enabled: true },
            { key: "tipoResiduo", label: "Tipo Residuo", category: "residuo", enabled: true },
            { key: "cantidadKg", label: "Cantidad KG", category: "residuo", enabled: true },
            { key: "cantidadM3", label: "Cantidad M3", category: "residuo", enabled: true },
            { key: "recolNombre", label: "Recolección", category: "residuo", enabled: true },
            { key: "tarifa", label: "Tarifa", category: "residuo", enabled: true },
        ];
        return baseColumns;
    };

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
            accessorKey: "cantidadKg",
            header: "KG",
        },
        {
            accessorKey: "cantidadM3",
            header: "M3",
        },
        {
            accessorKey: "recolNombre",
            header: "Recolección",
        },
        {
            accessorKey: "numFactura",
            header: "Número de Factura",
        },
        {
            accessorKey: "valor",
            header: "Valor Facturado",
        },
        {
            accessorKey: "tarifa",
            header: "Tarifa",
        },
    ];

    const asignarFactura = async (selectedRows: any[], invoiceNumber: string) => {
        console.log("Filas seleccionadas:", selectedRows);
        console.log("Número de factura:", invoiceNumber);
        setLoading(true);
        try {
            const ids = selectedRows.map(row => row.id);

            const data = {
                ids: ids,
                numeroFactura: invoiceNumber
            }
            const resp = await reportesService.asignarFactura(data);

            toast({
                title: "Factura asignada",
                description: "La factura ha sido asignada exitosamente",
                variant: "success",
            });
            handleGenerar();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.message || "No se pudo asignar factura",
                variant: "error",
            });
        } finally {
            setLoading(false);
        }
    }

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
                    exportCols = ["fecha", "planta", "sede", "nit", "ciudad", "direccion", "tipoResiduo", "cantidadKg", "cantidadM3", "recolNombre", "valor", "numFactura", "tarifa"];
                    exportHeads = ["Fecha", "Planta", "Sede", "NIT", "Ciudad", "Dirección", "Tipo Residuo", "Cantidad KG", "Cantidad M3", "Recolección", "Valor Facturado", "Número de Factura", "Tarifa"];
                    searchKey = ["fecha", "planta", "sede", "nit", "ciudad", "direccion", "tipoResiduo", "cantidadKg", "cantidadM3", "recolNombre", "valor", "numFactura", "tarifa"];
                    setColumns_table(tableR1);
                    break;
                case "reporte2":
                    dataP = await reportesService.generarReporte2(fechaInicio, fechaFin);
                    exportCols = ["fecha", "planta", "sede", "nit", "ciudad", "direccion", "tipoResiduo", "cantidadKg", "cantidadM3", "recolNombre", "valor", "numFactura", "tarifa"];
                    exportHeads = ["Fecha", "Planta", "Sede", "NIT", "Ciudad", "Dirección", "Tipo Residuo", "Cantidad KG", "Cantidad M3", "Recolección", "Valor Facturado", "Número de Factura", "Tarifa"];
                    searchKey = ["fecha", "planta", "sede", "nit", "ciudad", "direccion", "tipoResiduo", "cantidadKg", "cantidadM3", "recolNombre", "valor", "numFactura", "tarifa"];
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

    const handleOpenColumnConfig = () => {
        if (!tipoReporte) {
            toast({
                title: "Error",
                description: "Debe seleccionar un tipo de reporte primero",
                variant: "destructive",
            });
            return;
        }
        setAvailableColumns(getColumnConfig(tipoReporte));
        setColumnConfigOpen(true);
    };

    const handleColumnConfigConfirm = (selectedColumns: any[]) => {
        // Actualizar las columnas visibles en la tabla
        const enabledColumns = selectedColumns.filter(col => col.enabled);
        const newTableColumns = tableR1.filter(col => 
            enabledColumns.some(enabledCol => enabledCol.key === (col as any).accessorKey)
        );
        setColumns_table(newTableColumns);
        
        // Actualizar configuración de exportación
        const newExportCols = enabledColumns.map(col => col.key);
        const newExportHeaders = enabledColumns.map(col => col.label);
        setExportColumns(newExportCols);
        setExportHeaders(newExportHeaders);
        setSearchKey(newExportCols);
        
        toast({
            title: "Configuración aplicada",
            description: `Se configuraron ${enabledColumns.length} columnas para el reporte`,
        });
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

                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleOpenColumnConfig}
                                disabled={loading}
                                className="flex items-center gap-2"
                            >
                                <Settings className="h-4 w-4" />
                                Configurar Columnas
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
                    </div>
                </CardContent>
            </Card>

            <ReportDialog
                open={dialogTableOpen}
                onOpenChange={setDialogTableOpen}
                columns={columns_table}
                data={data}
                searchKey={searchKey}
                title={reporteNombre}
                exportColumns={exportColumns}
                exportHeaders={exportHeaders}
                showCheckboxes={true}
                showAssignInvoice={true}
                rowIdField="id"
                onAssignInvoice={(selectedRows, invoiceNumber) => {
                    asignarFactura(selectedRows, invoiceNumber);
                }}
            />

            <ColumnConfigDialog
                open={columnConfigOpen}
                onOpenChange={setColumnConfigOpen}
                columns={availableColumns}
                onConfirm={handleColumnConfigConfirm}
            />
        </div>
    );
}
