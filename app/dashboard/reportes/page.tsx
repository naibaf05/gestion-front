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
import { ColumnDef } from "@tanstack/react-table";
import { ReportDialog } from "@/components/dialogs/ReportDialog";
import { ColumnConfigDialog } from "@/components/dialogs/ColumnConfigDialog";
import { useAuth } from "@/contexts/AuthContext";

export default function ReportesPage() {
    const { user, logout } = useAuth();

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

    if (user && user.permisos && typeof user.permisos === "string") {
        user.permisos = JSON.parse(user.permisos);
    }

    const hasPermission = (permission: string): boolean => {
        if (!user || !user.permisos) return false
        if (user.perfil?.nombre === "ADMIN") return true
        return user.permisos[permission] === true
    }

    // Configuración de columnas por tipo de reporte (aplica permiso rates.view para mostrar tarifa)
    const getColumnConfig = (tipoReporte: TipoReporte) => {
        const canViewTarifa = hasPermission("rates.view");
        switch (tipoReporte) {
            case "reporte1":
            case "reporte2": {
                const cols = [
                    // ======= SECCIÓN SEDE =======
                    { key: "sedeNombre", label: "Nombre Sede", category: "sede", enabled: true },
                    { key: "sedeBarrio", label: "Barrio Sede", category: "sede", enabled: true },
                    { key: "sedeDireccion", label: "Dirección Sede", category: "sede", enabled: true },
                    { key: "sedeMail", label: "Email Sede", category: "sede", enabled: true },
                    { key: "sedeTelefono", label: "Teléfono Sede", category: "sede", enabled: true },
                    { key: "sedeAtencion", label: "Atención Sede", category: "sede", enabled: true },
                    { key: "sedeLat", label: "Latitud Sede", category: "sede", enabled: false },
                    { key: "sedeLon", label: "Longitud Sede", category: "sede", enabled: false },
                    { key: "ciudadSede", label: "Ciudad Sede", category: "sede", enabled: true },
                    { key: "plantaSede", label: "Planta Sede", category: "sede", enabled: true },

                    // ======= SECCIÓN CLIENTE =======
                    { key: "clienteNombre", label: "Nombre Cliente", category: "cliente", enabled: true },
                    { key: "clienteBarrio", label: "Barrio Cliente", category: "cliente", enabled: true },
                    { key: "clienteFechaRenovacion", label: "Fecha Renovación Cliente", category: "cliente", enabled: false },
                    { key: "clienteNit", label: "NIT Cliente", category: "cliente", enabled: true },
                    { key: "clienteTelefono", label: "Teléfono Cliente", category: "cliente", enabled: true },
                    { key: "clienteDireccion", label: "Dirección Cliente", category: "cliente", enabled: true },
                    { key: "clienteContacto", label: "Contacto Cliente", category: "cliente", enabled: true },
                    { key: "correoCliente", label: "Correo Cliente", category: "cliente", enabled: true },
                    { key: "correoFacCliente", label: "Correo Facturación Cliente", category: "cliente", enabled: false },
                    { key: "fechaCierreFacCliente", label: "Fecha Cierre Facturación Cliente", category: "cliente", enabled: false },
                    { key: "nombreComCliente", label: "Nombre Comercial Cliente", category: "cliente", enabled: false },

                    // ======= SECCIÓN VISITA =======
                    { key: "fechaVisita", label: "Fecha Visita", category: "visita", enabled: true },
                    { key: "tipoResiduo", label: "Tipo Residuo", category: "visita", enabled: true },
                    { key: "cantidad", label: "Cantidad", category: "visita", enabled: true },
                    { key: "recolNombre", label: "Nombre Recolector", category: "visita", enabled: true },
                    { key: "unidad", label: "Unidad", category: "visita", enabled: true },
                    { key: "numFactura", label: "Número Factura", category: "visita", enabled: true },
                    ...(canViewTarifa ? [{ key: "valor", label: "Valor", category: "visita", enabled: true }] : []),
                    ...(canViewTarifa ? [{ key: "tarifa", label: "Tarifa", category: "visita", enabled: true }] : []),
                    { key: "cantidadKg", label: "Cantidad KG", category: "visita", enabled: true },
                    { key: "cantidadM3", label: "Cantidad M3", category: "visita", enabled: true },
                    { key: "numCert", label: "Certificado", category: "visita", enabled: true },
                    { key: "unidades", label: "Unidades", category: "visita", enabled: true },
                    { key: "unidadEntrega", label: "Unidades de Entrega", category: "visita", enabled: true },
                ];
                return cols;
            }
            case "reporte3": {
                const cols = [
                    { key: "sedeNombre", label: "Nombre Sede", category: "sede", enabled: true },
                    { key: "sedeBarrio", label: "Barrio Sede", category: "sede", enabled: true },
                    { key: "sedeDireccion", label: "Dirección Sede", category: "sede", enabled: true },
                    { key: "clienteNombre", label: "Nombre Cliente", category: "cliente", enabled: true },
                    { key: "clienteBarrio", label: "Barrio Cliente", category: "cliente", enabled: true },
                    { key: "clienteNit", label: "NIT Cliente", category: "cliente", enabled: true },
                    { key: "fecha", label: "Fecha", category: "visita", enabled: true },
                    { key: "peso", label: "Peso (KG)", category: "visita", enabled: true },
                    { key: "conductor", label: "Conductor", category: "visita", enabled: true },
                    { key: "placa", label: "Placa", category: "visita", enabled: true },
                    { key: "remision", label: "Remisión", category: "visita", enabled: true },
                    { key: "tipoResiduo", label: "Producto", category: "visita", enabled: true },
                    { key: "numFactura", label: "Número Factura", category: "visita", enabled: true },
                    ...(canViewTarifa ? [{ key: "tarifa", label: "Tarifa", category: "visita", enabled: true }] : []),
                    ...(canViewTarifa ? [{ key: "valor", label: "Valor", category: "visita", enabled: true }] : []),
                    { key: "planta", label: "Planta", category: "visita", enabled: true },
                ];
                return cols;
            }
            default:
                return [];
        }
    };

    // Función helper para obtener la configuración de columnas a usar
    const getEffectiveColumnConfig = (tipoReporte: TipoReporte) => {
        const canViewTarifa = hasPermission("rates.view");
        if (userColumnConfig) {
            // Filtrar según permiso tarifa
            return userColumnConfig.filter(col => col.enabled && (canViewTarifa || col.key !== "tarifa"));
        }

        // Configuración por defecto filtrando tarifa si no hay permiso
        switch (tipoReporte) {
            case "reporte1":
            case "reporte2": {
                const defaultCols = [
                    // === COLUMNAS POR DEFECTO ORGANIZADAS POR SECCIÓN ===

                    // SEDE (4 columnas principales)
                    { key: "plantaSede", label: "Planta Sede", width: "350px" },
                    { key: "sedeNombre", label: "Nombre Sede", width: "250px" },
                    { key: "ciudadSede", label: "Ciudad Sede", width: "150px" },
                    { key: "sedeDireccion", label: "Dirección Sede", width: "350px" },

                    // CLIENTE (3 columnas principales)
                    { key: "clienteNit", label: "NIT Cliente", width: "200px" },
                    { key: "clienteNombre", label: "Nombre Cliente", width: "250px" },
                    { key: "clienteDireccion", label: "Dirección Cliente", width: "350px" },

                    // VISITA (8 columnas principales)
                    { key: "fechaVisita", label: "Fecha Visita", width: "120px" },
                    { key: "tipoResiduo", label: "Tipo Residuo", width: "180px" },
                    { key: "cantidadKg", label: "Cantidad KG", width: "120px" },
                    { key: "cantidadM3", label: "Cantidad M3", width: "120px" },
                    { key: "recolNombre", label: "Nombre Recolector", width: "200px" },
                    { key: "numFactura", label: "Número Factura", width: "150px" },
                    ...(canViewTarifa ? [{ key: "valor", label: "Valor", width: "150px" }] : []),
                    ...(canViewTarifa ? [{ key: "tarifa", label: "Tarifa", width: "150px" }] : []),
                ];
                return defaultCols;
            }
            case "reporte3": {
                const defaultCols = [
                    { key: "fecha", label: "Fecha", width: "120px" },
                    { key: "sedeNombre", label: "Nombre Sede", width: "200px" },
                    { key: "sedeDireccion", label: "Dirección Sede", width: "350px" },
                    { key: "clienteNombre", label: "Nombre Cliente", width: "250px" },
                    { key: "clienteNit", label: "NIT Cliente", width: "180px" },
                    { key: "peso", label: "Peso (KG)", width: "120px" },
                    { key: "remision", label: "Remisión", width: "150px" },
                    { key: "tipoResiduo", label: "Producto", category: "visita", enabled: true },
                    { key: "numFactura", label: "Número Factura", category: "visita", enabled: true },
                    ...(canViewTarifa ? [{ key: "tarifa", label: "Tarifa", width: "150px" }] : []),
                    ...(canViewTarifa ? [{ key: "valor", label: "Valor", width: "150px" }] : []),
                    { key: "planta", label: "Planta", width: "350px" },
                ];
                return defaultCols;
            }
            default:
                return [];
        }
    };

    // Normalizar widths y añadir id estable
    const normalizeWidth = (w: any): string => {
        if (w == null) return 'auto';
        if (typeof w === 'number') return `${w}px`;
        if (typeof w === 'string' && w.trim() !== '') return w.trim();
        return 'auto';
    };

    // Columnas que deben mostrarse con formato monetario (sin alterar el valor original numérico)
    const CURRENCY_COLUMNS = new Set(["valor", "tarifa"]);
    const currencyFormatter = new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 2,
    });

    // Generar columnas; para columnas monetarias se usa un cell renderer que formatea sólo la visualización
    const generateTableColumns = (effectiveColumns: any[]): ColumnDef<any>[] => {
        return effectiveColumns.map(col => {
            const width = normalizeWidth(col.width);
            const key = col.key;
            const base: ColumnDef<any> = {
                id: key,
                accessorKey: key,
                header: col.label,
                width,
            };
            if (CURRENCY_COLUMNS.has(key)) {
                base.cell = ({ row }) => {
                    const raw = row.original[key];
                    const numeric = typeof raw === 'number' ? raw : (raw == null || raw === '' ? 0 : Number(raw));
                    return (
                        <div className="text-right tabular-nums font-medium">{currencyFormatter.format(numeric)}</div>
                    );
                };
            }
            return base;
        });
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

    // Estado para almacenar la configuración de columnas del usuario
    const [userColumnConfig, setUserColumnConfig] = useState<any[] | null>(null);

    const asignarFactura = async (selectedRows: any[], invoiceNumber: string) => {
        console.log("Filas seleccionadas:", selectedRows);
        console.log("Número de factura:", invoiceNumber);
        setLoading(true);
        try {
            const ids = selectedRows.map(row => row.id);
            const data = {
                ids,
                numeroFactura: invoiceNumber,
                tipo: tipoReporte
            };
            const resp = await reportesService.asignarFactura(data);
            console.log("Respuesta del servicio:", resp);
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
            const nombre = tiposReporte.find(r => r.value === tipoReporte)?.label || tipoReporte;
            setReporteNombre(nombre);

            // Obtener la configuración de columnas efectiva (usuario o por defecto)
            const effectiveColumns = getEffectiveColumnConfig(tipoReporte);
            const exportCols = effectiveColumns.map(col => col.key);
            const exportHeads = effectiveColumns.map(col => col.label);
            const searchKey = exportCols;

            // Generar columnas de tabla dinámicamente
            const dynamicTableColumns = generateTableColumns(effectiveColumns);

            // Llamar al servicio según el tipo de reporte
            switch (tipoReporte) {
                case "reporte1":
                    dataP = await reportesService.generarReporte1(fechaInicio, fechaFin);
                    setColumns_table(dynamicTableColumns);
                    break;
                case "reporte2":
                    dataP = await reportesService.generarReporte2(fechaInicio, fechaFin);
                    setColumns_table(dynamicTableColumns);
                    break;
                case "reporte3":
                    dataP = await reportesService.generarReporte3(fechaInicio, fechaFin);
                    setColumns_table(dynamicTableColumns);
                    break;
                case "reporte4":
                    dataP = await reportesService.generarReporte4(fechaInicio, fechaFin);
                    setColumns_table(dynamicTableColumns);
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
        // Guardar la configuración del usuario
        setUserColumnConfig(selectedColumns);

        // Actualizar las columnas visibles en la tabla
        const enabledColumns = selectedColumns.filter(col => col.enabled);
        const newTableColumns = generateTableColumns(enabledColumns);
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
        setUserColumnConfig(null); // Limpiar configuración de columnas del usuario
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

    if (!hasPermission("reportes.view")) {
        return <div className="p-8 text-center text-muted-foreground">No tienes permiso para ver los reportes.</div>
    }

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
                showCheckboxes={hasPermission("reportes.assign")}
                showAssignInvoice={hasPermission("reportes.assign")}
                rowIdField="id"
                onAssignInvoice={(selectedRows, invoiceNumber) => asignarFactura(selectedRows, invoiceNumber)}
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
