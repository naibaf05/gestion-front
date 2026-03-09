"use client";

import { useState } from "react";
import type { } from "@/types";
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
import { ColumnDef } from "@tanstack/react-table";
import { ReportDialog } from "@/components/dialogs/ReportDialog";
import { ColumnConfigDialog } from "@/components/dialogs/ColumnConfigDialog";
import { useAuth } from "@/contexts/AuthContext";

type TipoReporteCli = "reporte1" | "reporte2" | "reporte3";

export default function ReportesCliPage() {
    const { user } = useAuth();

    const [tipoReporte, setTipoReporte] = useState<TipoReporteCli | "">("");
    const [reporteNombre, setReporteNombre] = useState<string>("");
    const [fechaInicio, setFechaInicio] = useState(() => {
        const today = new Date();
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Bogota',
            year: 'numeric', month: '2-digit', day: '2-digit',
        }).format(today);
    });
    const [fechaFin, setFechaFin] = useState(() => {
        const today = new Date();
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Bogota',
            year: 'numeric', month: '2-digit', day: '2-digit',
        }).format(today);
    });
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const [dialogTableOpen, setDialogTableOpen] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [columnConfigOpen, setColumnConfigOpen] = useState(false);
    const [availableColumns, setAvailableColumns] = useState<any[]>([]);
    const [exportColumns, setExportColumns] = useState<string[]>([]);
    const [exportHeaders, setExportHeaders] = useState<string[]>([]);
    const [searchKey, setSearchKey] = useState<string[]>([]);
    const [columns_table, setColumns_table] = useState<ColumnDef<any>[]>([]);
    const [userColumnConfig, setUserColumnConfig] = useState<any[] | null>(null);

    if (user && user.permisos && typeof user.permisos === "string") {
        user.permisos = JSON.parse(user.permisos);
    }

    const hasPermission = (permission: string): boolean => {
        if (!user || !user.permisos) return false;
        if (user.perfil?.nombre === "ADMIN") return true;
        return user.permisos[permission] === true;
    };

    const CURRENCY_COLUMNS = new Set(["valor", "tarifa"]);
    const currencyFormatter = new Intl.NumberFormat("es-CO", {
        style: "currency", currency: "COP", minimumFractionDigits: 2,
    });

    const normalizeWidth = (w: any): string => {
        if (w == null) return 'auto';
        if (typeof w === 'number') return `${w}px`;
        if (typeof w === 'string' && w.trim() !== '') return w.trim();
        return 'auto';
    };

    const generateTableColumns = (effectiveColumns: any[]): ColumnDef<any>[] => {
        return effectiveColumns.map(col => {
            const width = normalizeWidth(col.width);
            const key = col.key;
            const base: ColumnDef<any> = { id: key, accessorKey: key, header: col.label, width };
            if (CURRENCY_COLUMNS.has(key)) {
                base.cell = ({ row }) => {
                    const raw = row.original[key];
                    const numeric = typeof raw === 'number' ? raw : (raw == null || raw === '' ? 0 : Number(raw));
                    return <div className="text-right tabular-nums font-medium">{currencyFormatter.format(numeric)}</div>;
                };
            }
            return base;
        });
    };

    const getColumnConfig = (tipo: TipoReporteCli) => {
        const canViewTarifa = hasPermission("rates.view");
        switch (tipo) {
            case "reporte1":
            case "reporte2":
                return [
                    { key: "plantaSede", label: "Planta Sede", category: "sede", enabled: true, width: "350px" },
                    { key: "sedeNombre", label: "Nombre Sede", category: "sede", enabled: true, width: "250px" },
                    { key: "ciudadSede", label: "Ciudad Sede", category: "sede", enabled: true, width: "150px" },
                    { key: "sedeDireccion", label: "Dirección Sede", category: "sede", enabled: true, width: "350px" },
                    { key: "sedeBarrio", label: "Barrio Sede", category: "sede", enabled: false, width: "150px" },
                    { key: "sedeMail", label: "Email Sede", category: "sede", enabled: false, width: "250px" },
                    { key: "sedeTelefono", label: "Teléfono Sede", category: "sede", enabled: false, width: "150px" },
                    { key: "sedeAtencion", label: "Atención Sede", category: "sede", enabled: false, width: "200px" },
                    { key: "clienteNit", label: "NIT Cliente", category: "cliente", enabled: true, width: "200px" },
                    { key: "clienteNombre", label: "Nombre Cliente", category: "cliente", enabled: true, width: "250px" },
                    { key: "clienteDireccion", label: "Dirección Cliente", category: "cliente", enabled: true, width: "350px" },
                    { key: "clienteTelefono", label: "Teléfono Cliente", category: "cliente", enabled: false, width: "150px" },
                    { key: "clienteContacto", label: "Contacto Cliente", category: "cliente", enabled: false, width: "200px" },
                    { key: "correoCliente", label: "Correo Cliente", category: "cliente", enabled: false, width: "250px" },
                    { key: "tipo", label: "Tipo Recolección", category: "visita", enabled: true, width: "180px" },
                    { key: "plantaEntrega", label: "Planta Entrega", category: "visita", enabled: true, width: "350px" },
                    { key: "fechaVisita", label: "Fecha Visita", category: "visita", enabled: true, width: "120px" },
                    { key: "tipoResiduo", label: "Tipo Residuo", category: "visita", enabled: true, width: "180px" },
                    { key: "cantidadKg", label: "Cantidad KG", category: "visita", enabled: true, width: "120px" },
                    { key: "cantidadM3", label: "Cantidad M3", category: "visita", enabled: true, width: "120px" },
                    { key: "recolNombre", label: "Nombre Recolector", category: "visita", enabled: true, width: "200px" },
                    { key: "numFactura", label: "Número Factura", category: "visita", enabled: true, width: "150px" },
                    { key: "fecFactura", label: "Fecha Factura", category: "visita", enabled: true, width: "120px" },
                    ...(canViewTarifa ? [{ key: "valor", label: "Valor", category: "visita", enabled: true, width: "150px" }] : []),
                    ...(canViewTarifa ? [{ key: "tarifa", label: "Tarifa", category: "visita", enabled: true, width: "150px" }] : []),
                    { key: "numCert", label: "Certificado", category: "visita", enabled: false, width: "150px" },
                ];
            case "reporte3":
                return [
                    { key: "fecha", label: "Fecha", category: "visita", enabled: true, width: "120px" },
                    { key: "nitSalida", label: "Nit Salida", category: "salida", enabled: true, width: "180px" },
                    { key: "nombreSalida", label: "Nombre Salida", category: "salida", enabled: true, width: "300px" },
                    { key: "nitDestino", label: "Nit Destino", category: "destino", enabled: true, width: "180px" },
                    { key: "nombreDestino", label: "Nombre Destino", category: "destino", enabled: true, width: "300px" },
                    { key: "peso", label: "Peso (KG)", category: "visita", enabled: true, width: "120px" },
                    { key: "remision", label: "Remisión", category: "visita", enabled: true, width: "150px" },
                    { key: "tipoResiduo", label: "Producto", category: "visita", enabled: true, width: "180px" },
                    { key: "numFactura", label: "Número Factura", category: "visita", enabled: true, width: "150px" },
                    { key: "fecFactura", label: "Fecha Factura", category: "visita", enabled: true, width: "120px" },
                    ...(canViewTarifa ? [{ key: "tarifa", label: "Tarifa", category: "visita", enabled: true, width: "150px" }] : []),
                    ...(canViewTarifa ? [{ key: "valor", label: "Valor", category: "visita", enabled: true, width: "150px" }] : []),
                    { key: "direccionSalida", label: "Dirección Salida", category: "salida", enabled: false, width: "300px" },
                    { key: "ciudadSalida", label: "Ciudad Salida", category: "salida", enabled: false, width: "150px" },
                    { key: "direccionDestino", label: "Dirección Destino", category: "destino", enabled: false, width: "300px" },
                    { key: "ciudadDestino", label: "Ciudad Destino", category: "destino", enabled: false, width: "150px" },
                    { key: "conductor", label: "Conductor", category: "visita", enabled: false, width: "200px" },
                    { key: "placa", label: "Placa", category: "visita", enabled: false, width: "120px" },
                ];
            default:
                return [];
        }
    };

    const getEffectiveColumnConfig = (tipo: TipoReporteCli) => {
        const canViewTarifa = hasPermission("rates.view");
        const base = userColumnConfig ?? getColumnConfig(tipo);
        return base.filter(col => col.enabled && (canViewTarifa || col.key !== "tarifa"));
    };

    const tiposReporte = [
        { value: "reporte1", label: "Reporte Recolecciones y/o entregas en plantas (Residuos)" },
        { value: "reporte2", label: "Reporte Recolecciones y/o entregas en plantas (Llantas)" },
        { value: "reporte3", label: "Reporte Salidas" },
    ];

    const handleGenerar = async () => {
        if (!tipoReporte) {
            toast({ title: "Error", description: "Debe seleccionar un tipo de reporte", variant: "error" });
            return;
        }
        if (!fechaInicio || !fechaFin) {
            toast({ title: "Error", description: "Debe seleccionar las fechas de inicio y fin", variant: "error" });
            return;
        }
        if (new Date(fechaInicio) > new Date(fechaFin)) {
            toast({ title: "Error", description: "La fecha de inicio no puede ser mayor que la fecha de fin", variant: "error" });
            return;
        }

        setLoading(true);
        try {
            const nombre = tiposReporte.find(r => r.value === tipoReporte)?.label || tipoReporte;
            setReporteNombre(nombre);

            const effectiveColumns = getEffectiveColumnConfig(tipoReporte);
            const exportCols = effectiveColumns.map(col => col.key);
            const exportHeads = effectiveColumns.map(col => col.label);
            const dynamicTableColumns = generateTableColumns(effectiveColumns);

            let dataP: any[] = [];
            switch (tipoReporte) {
                case "reporte1":
                    dataP = await reportesService.generarReporte1Cli(fechaInicio, fechaFin);
                    break;
                case "reporte2":
                    dataP = await reportesService.generarReporte2Cli(fechaInicio, fechaFin);
                    break;
                case "reporte3":
                    dataP = await reportesService.generarReporte3Cli(fechaInicio, fechaFin);
                    break;
            }

            setData(dataP);
            setColumns_table(dynamicTableColumns);
            setExportColumns(exportCols);
            setExportHeaders(exportHeads);
            setSearchKey(exportCols);
            setDialogTableOpen(true);
        } catch (error: any) {
            toast({ title: "Error", description: error?.message || "No se pudo generar el reporte", variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenColumnConfig = () => {
        if (!tipoReporte) {
            toast({ title: "Error", description: "Debe seleccionar un tipo de reporte primero", variant: "destructive" });
            return;
        }
        setAvailableColumns(getColumnConfig(tipoReporte));
        setColumnConfigOpen(true);
    };

    const handleColumnConfigConfirm = (selectedColumns: any[]) => {
        setUserColumnConfig(selectedColumns);
        const enabledColumns = selectedColumns.filter(col => col.enabled);
        setColumns_table(generateTableColumns(enabledColumns));
        setExportColumns(enabledColumns.map(col => col.key));
        setExportHeaders(enabledColumns.map(col => col.label));
        setSearchKey(enabledColumns.map(col => col.key));
        toast({ title: "Configuración aplicada", description: `Se configuraron ${enabledColumns.length} columnas` });
    };

    const resetForm = () => {
        setTipoReporte("");
        setUserColumnConfig(null);
        const today = new Date();
        const todayFormatted = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit',
        }).format(today);
        setFechaInicio(todayFormatted);
        setFechaFin(todayFormatted);
    };

    if (!hasPermission("reportes-cli.view")) {
        return <div className="p-8 text-center text-muted-foreground">No tienes permiso para ver los reportes.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
                    <p className="text-gray-600 mt-1">Consulte sus reportes de recolecciones y salidas</p>
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
                                onValueChange={(value) => setTipoReporte(value as TipoReporteCli)}
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
                        <Button type="button" variant="outline" onClick={resetForm} disabled={loading}>
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
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
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
                showCheckboxes={false}
                showAssignInvoice={false}
                rowIdField="id"
                tipoReporte={tipoReporte as TipoReporte}
            />

            <ColumnConfigDialog
                open={columnConfigOpen}
                onOpenChange={setColumnConfigOpen}
                columns={availableColumns}
                defaultColumns={availableColumns}
                onConfirm={handleColumnConfigConfirm}
            />
        </div>
    );
}
