"use client";

import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import { FileSpreadsheet, History, Receipt } from "lucide-react";
import { exportToExcel } from "@/lib/exportExcel";
import { Checkbox } from "@/components/ui/checkbox";
import { SelectMultiple } from "@/components/ui/select-multiple";
import { HistorialDialog } from "./HistorialDialog";

interface ReportDialogProps<TData, TValue> {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    columns: any[];
    data: TData[];
    searchKey?: string | string[];
    searchPlaceholder?: string;
    title?: string;
    exportColumns?: string[]; // array de keys a exportar
    exportHeaders?: string[]; // opcional: nombres de columnas en Excel
    maxWidth?: string; // ancho máximo configurable (ej: "1200px", "95vw", "90%")
    showCheckboxes?: boolean; // nueva prop para mostrar checkboxes
    showAssignInvoice?: boolean;
    onAssignInvoice?: (selectedRows: TData[], invoiceNumber: string, invoiceDate?: string) => void;
    showAssignInvoiceExterna?: boolean;
    onAssignInvoiceExterna?: (selectedRows: TData[], invoiceNumber: string, invoiceDate?: string) => void;
    showCreateExternalCertificates?: boolean;
    onCreateExternalCertificates?: (selectedRows: TData[], numero: string, fecha: string, archivo: File) => void;
    rowIdField?: string; // campo que actúa como ID único para cada fila (ej: "id", "codigo")
    checkboxColumnWidth?: string; // ancho de la columna de selección (ej: "40px")
    tipoReporte?: string; // nuevo campo para identificar el tipo de reporte en el historial
}

export function ReportDialog<TData, TValue>({
    open,
    onOpenChange,
    columns,
    data,
    searchKey,
    searchPlaceholder = "Buscar...",
    title = "Tabla de datos",
    exportColumns,
    exportHeaders,
    maxWidth = "95vw",
    showCheckboxes = false,
    showAssignInvoice = false,
    onAssignInvoice,
    showAssignInvoiceExterna = false,
    onAssignInvoiceExterna,
    showCreateExternalCertificates = false,
    onCreateExternalCertificates,
    rowIdField = "id",
    checkboxColumnWidth,
    tipoReporte,
}: ReportDialogProps<TData, TValue>) {
    const { toast } = useToast();
    // Constante configurable para el ancho de la columna de checks
    const DEFAULT_CHECK_COL_WIDTH = "100px";
    const checkColWidth = checkboxColumnWidth || DEFAULT_CHECK_COL_WIDTH;
    // Columnas consideradas monetarias para formatear sumatorias
    const CURRENCY_KEYS = React.useMemo(() => new Set(["valor", "tarifa", "tarifaFlete", "tarifaGestor"]), []);
    const currencyFormatter = React.useMemo(() => new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 2,
    }), []);
    // Estados para los checkboxes
    const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set());
    const [selectAll, setSelectAll] = React.useState(false);
    const [tableInstance, setTableInstance] = React.useState<any>(null);

    // Estados para el diálogo de asignar factura
    const [invoiceDialogOpen, setInvoiceDialogOpen] = React.useState(false);
    const [invoiceNumber, setInvoiceNumber] = React.useState("");
    const [invoiceDate, setInvoiceDate] = React.useState("");
    // Estados para factura externa
    const [invoiceExtDialogOpen, setInvoiceExtDialogOpen] = React.useState(false);
    const [invoiceExtNumber, setInvoiceExtNumber] = React.useState("");
    const [invoiceExtDate, setInvoiceExtDate] = React.useState("");
    // Filtro para mostrar sólo registros sin número de factura
    const [showOnlyWithoutFactura, setShowOnlyWithoutFactura] = React.useState(false);
    // Filtro para mostrar sólo registros sin fecha de factura
    const [showOnlyWithoutFecFactura, setShowOnlyWithoutFecFactura] = React.useState(false);
    // Filtros para factura externa
    const [showOnlyWithoutFacturaExt, setShowOnlyWithoutFacturaExt] = React.useState(false);
    const [showOnlyWithoutFecFacturaExt, setShowOnlyWithoutFecFacturaExt] = React.useState(false);

    // Estado para sumar columnas
    const [summaryKeys, setSummaryKeys] = React.useState<string[]>([]);
    const [filteredRows, setFilteredRows] = React.useState<any[]>(data);
    const [externalCertDialogOpen, setExternalCertDialogOpen] = React.useState(false);
    const [externalCertNumber, setExternalCertNumber] = React.useState("");
    const [externalCertDate, setExternalCertDate] = React.useState("");
    const [externalCertFile, setExternalCertFile] = React.useState<File | null>(null);

    const [historialOpen, setHistorialOpen] = React.useState(false);
    const [historialId, setHistorialId] = React.useState<string>("");
    const [historialLabel, setHistorialLabel] = React.useState<string>("");

    // Efecto para limpiar selecciones cuando se cierra el diálogo
    React.useEffect(() => {
        if (!open) {
            setSelectedRows(new Set());
            setSelectAll(false);
            setInvoiceNumber("");
            setInvoiceExtNumber("");
            setShowOnlyWithoutFacturaExt(false);
            setShowOnlyWithoutFecFacturaExt(false);
        }
    }, [open]);

    // Inicializar columnas a sumar por defecto cuando cambian las columnas
    React.useEffect(() => {
        const colKeys = (columns || []).map((c: any) => String(c.accessorKey || c.id)).filter(Boolean);
        const defaults: string[] = [];
        // Elegir sólo columnas numéricas por defecto
        const numericCandidates = ["cantidadKg", "valor", "cantidad", "tarifa", "tarifaFlete", "tarifaGestor"];
        numericCandidates.forEach(k => {
            if (colKeys.includes(k)) defaults.push(k);
        });
        setSummaryKeys(defaults);
    }, [columns]);

    // Cuando cambian las columnas, eliminar llaves que ya no existen
    React.useEffect(() => {
        if (!summaryKeys.length) return;
        const colKeys = new Set((columns || []).map((c: any) => String(c.accessorKey || c.id)).filter(Boolean));
        const cleaned = summaryKeys.filter(k => colKeys.has(k));
        if (cleaned.length !== summaryKeys.length) {
            setSummaryKeys(cleaned);
        }
    }, [columns, summaryKeys]);

    // Manejar selección individual de filas
    const handleRowSelect = (rowId: string, checked: boolean, table?: any) => {
        const newSelectedRows = new Set(selectedRows);
        if (checked) {
            newSelectedRows.add(rowId);
        } else {
            newSelectedRows.delete(rowId);
        }
        setSelectedRows(newSelectedRows);

        // Actualizar estado de "select all" basado en filas visibles/filtradas
        if (table) {
            const filteredRows = table.getFilteredRowModel().rows;
            const filteredIds = filteredRows.map((row: any) => String(row.original[rowIdField]));
            const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id: string) => newSelectedRows.has(id));
            setSelectAll(allFilteredSelected);
        }
    };

    // Manejar selección de todas las filas (solo las visibles/filtradas)
    const handleSelectAll = (checked: boolean, table?: any) => {
        if (table) {
            const filteredRows = table.getFilteredRowModel().rows;
            const filteredIds = filteredRows.map((row: any) => String(row.original[rowIdField]));

            const newSelectedRows = new Set(selectedRows);

            if (checked) {
                // Agregar todas las filas filtradas a la selección
                filteredIds.forEach((id: string) => newSelectedRows.add(id));
            } else {
                // Remover todas las filas filtradas de la selección
                filteredIds.forEach((id: string) => newSelectedRows.delete(id));
            }

            setSelectedRows(newSelectedRows);
        }
        setSelectAll(checked);
    };

    // Crear columnas con checkbox y header especial para numFactura (filtro vacíos)
    const columnsWithCheckbox = React.useMemo(() => {
        let working = columns as any[];
        if (showCheckboxes) {
            const checkboxColumn = {
                id: "select",
                width: checkColWidth,
                header: ({ table }: any) => {
                    const filteredRows = table.getFilteredRowModel().rows;
                    const filteredIds = filteredRows.map((row: any) => String(row.original[rowIdField]));
                    const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id: string) => selectedRows.has(id));
                    const someFilteredSelected = filteredIds.some((id: string) => selectedRows.has(id));
                    return (
                        <div className="flex items-center justify-center">
                            <Checkbox
                                checked={allFilteredSelected}
                                onCheckedChange={(checked) => handleSelectAll(checked as boolean, table)}
                                aria-label="Seleccionar todas las filas visibles"
                                className={someFilteredSelected && !allFilteredSelected ? "data-[state=checked]:bg-primary/50" : ""}
                            />
                            {someFilteredSelected && !allFilteredSelected && (
                                <span className="ml-1 text-xs text-gray-500">
                                    ({filteredIds.filter((id: string) => selectedRows.has(id)).length}/{filteredIds.length})
                                </span>
                            )}
                        </div>
                    );
                },
                cell: ({ row, table }: any) => {
                    const rowId = String(row.original[rowIdField]);
                    return (
                        <div className="flex items-center justify-center">
                            <Checkbox
                                checked={selectedRows.has(rowId)}
                                onCheckedChange={(checked) => handleRowSelect(rowId, checked as boolean, table)}
                                aria-label={`Seleccionar fila ${rowId}`}
                            />
                        </div>
                    );
                },
                enableSorting: false,
                enableHiding: false,
            };
            working = [checkboxColumn, ...working];
        }
        working = working.map(col => {
            const key = col.accessorKey || col.id;
            if (key === 'numFactura') {
                return {
                    ...col,
                    header: () => (
                        <div className="flex flex-col gap-1 py-1">
                            <span className="text-xs font-medium">Número Factura</span>
                            <label className="flex items-center gap-1 text-[10px] font-normal">
                                <Checkbox
                                    checked={showOnlyWithoutFactura}
                                    onCheckedChange={(checked) => setShowOnlyWithoutFactura(!!checked)}
                                    aria-label="Filtrar vacíos"
                                />
                                <span className="select-none">Vacíos</span>
                            </label>
                        </div>
                    )
                };
            }
            if (key === 'fecFactura') {
                return {
                    ...col,
                    header: () => (
                        <div className="flex flex-col gap-1 py-1">
                            <span className="text-xs font-medium">Fecha Factura</span>
                            <label className="flex items-center gap-1 text-[10px] font-normal">
                                <Checkbox
                                    checked={showOnlyWithoutFecFactura}
                                    onCheckedChange={(checked) => setShowOnlyWithoutFecFactura(!!checked)}
                                    aria-label="Filtrar vacíos"
                                />
                                <span className="select-none">Vacíos</span>
                            </label>
                        </div>
                    )
                };
            }
            if (key === 'numFacturaExt') {
                return {
                    ...col,
                    header: () => (
                        <div className="flex flex-col gap-1 py-1">
                            <span className="text-xs font-medium">Número Factura Externa</span>
                            <label className="flex items-center gap-1 text-[10px] font-normal">
                                <Checkbox
                                    checked={showOnlyWithoutFacturaExt}
                                    onCheckedChange={(checked) => setShowOnlyWithoutFacturaExt(!!checked)}
                                    aria-label="Filtrar vacíos"
                                />
                                <span className="select-none">Vacíos</span>
                            </label>
                        </div>
                    )
                };
            }
            if (key === 'fecFacturaExt') {
                return {
                    ...col,
                    header: () => (
                        <div className="flex flex-col gap-1 py-1">
                            <span className="text-xs font-medium">Fecha Factura Externa</span>
                            <label className="flex items-center gap-1 text-[10px] font-normal">
                                <Checkbox
                                    checked={showOnlyWithoutFecFacturaExt}
                                    onCheckedChange={(checked) => setShowOnlyWithoutFecFacturaExt(!!checked)}
                                    aria-label="Filtrar vacíos"
                                />
                                <span className="select-none">Vacíos</span>
                            </label>
                        </div>
                    )
                };
            }
            return col;
        });
        return working;
    }, [columns, showCheckboxes, selectedRows, selectAll, data, rowIdField, showOnlyWithoutFactura, showOnlyWithoutFecFactura, checkColWidth]);

    // Data filtrada según toggle de facturas vacías
    const dataForTable = React.useMemo(() => {
        const isEmpty = (v: any) => v == null || String(v).trim() === "";
        if (!showOnlyWithoutFactura && !showOnlyWithoutFecFactura && !showOnlyWithoutFacturaExt && !showOnlyWithoutFecFacturaExt) return data;
        return data.filter((r: any) => {
            let pass = true;
            if (showOnlyWithoutFactura) pass = pass && isEmpty(r?.numFactura);
            if (showOnlyWithoutFecFactura) pass = pass && isEmpty(r?.fecFactura);
            if (showOnlyWithoutFacturaExt) pass = pass && isEmpty(r?.numFacturaExt);
            if (showOnlyWithoutFecFacturaExt) pass = pass && isEmpty(r?.fecFacturaExt);
            return pass;
        });
    }, [data, showOnlyWithoutFactura, showOnlyWithoutFecFactura, showOnlyWithoutFacturaExt, showOnlyWithoutFecFacturaExt]);

    // Mantener filteredRows sincronizado con dataForTable cuando cambia el filtro de factura vacía
    React.useEffect(() => {
        setFilteredRows(dataForTable);
    }, [dataForTable]);

    // Manejar exportación a Excel
    const handleExportExcel = async () => {
        const keys = exportColumns && exportColumns.length > 0
            ? exportColumns
            : columns.filter((col: any) => col.id !== "actions").map((col: any) => col.accessorKey || col.id);

        const hdrs = exportHeaders && exportHeaders.length === keys.length
            ? exportHeaders
            : keys;

        const exportData = showOnlyWithoutFactura || showOnlyWithoutFecFactura ? dataForTable : data;

        await exportToExcel({ keys, headers: hdrs, data: data as any[], title, exportData: exportData as any[] });
    };

    // Manejar asignación de factura
    const handleAssignInvoiceClick = () => {
        if (selectedRows.size === 0) {
            message("Error", "Por favor selecciona al menos una fila para asignar factura.", "error");
            return;
        }
        setInvoiceDialogOpen(true);
    };

    const handleAssignInvoiceExtClick = () => {
        if (selectedRows.size === 0) {
            message("Error", "Por favor selecciona al menos una fila para asignar factura externa.", "error");
            return;
        }
        setInvoiceExtDialogOpen(true);
    };

    const getSelectedRows = (): TData[] => data.filter((row: any) => selectedRows.has(String(row[rowIdField])));

    const handleConfirmAssignInvoiceExt = () => {
        if (!invoiceExtNumber.trim()) {
            message("Error", "Por favor ingresa un número de factura externa.", "error");
            return;
        }
        if (!invoiceExtDate.trim()) {
            message("Error", "Por favor selecciona la fecha de la factura externa.", "error");
            return;
        }
        const selectedRowsData = data.filter((row: any) => selectedRows.has(String(row[rowIdField])));
        onAssignInvoiceExterna?.(selectedRowsData, invoiceExtNumber.trim(), invoiceExtDate.trim());
        setInvoiceExtNumber("");
        setInvoiceExtDate("");
        setInvoiceExtDialogOpen(false);
        setSelectedRows(new Set());
        setSelectAll(false);
    };

    // Confirmar asignación de factura
    const handleConfirmAssignInvoice = () => {
        if (!invoiceNumber.trim()) {
            message("Error", "Por favor ingresa un número de factura.", "error");
            return;
        }
        if (!invoiceDate.trim()) {
            message("Error", "Por favor selecciona la fecha de la factura.", "error");
            return;
        }

        // Obtener las filas seleccionadas
        const selectedRowsData = data.filter((row: any) =>
            selectedRows.has(String(row[rowIdField]))
        );

        // Llamar al callback
        onAssignInvoice?.(selectedRowsData, invoiceNumber.trim(), invoiceDate.trim());

        // Limpiar y cerrar
        setInvoiceNumber("");
        setInvoiceDate("");
        setInvoiceDialogOpen(false);
        setSelectedRows(new Set());
        setSelectAll(false);
    };

    // Utilidad para convertir a número tolerando formatos comunes (1.234,56 / 1,234.56 / $1.234)
    const toNumber = (val: any): number => {
        if (val == null) return 0;
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
            let s = val.trim();
            if (!s) return 0;
            // Eliminar símbolos no numéricos excepto separadores y signo
            s = s.replace(/[^0-9.,\-]/g, "");
            // Si parece usar coma como decimal (más a la derecha que el punto o no hay punto)
            if (s.includes(',') && (!s.includes('.') || s.lastIndexOf(',') > s.lastIndexOf('.'))) {
                s = s.replace(/\./g, ""); // quitar miles con punto
                s = s.replace(/,/g, "."); // coma decimal -> punto
            } else {
                // caso estilo en-US: quitar comas de miles
                s = s.replace(/,/g, "");
            }
            const n = parseFloat(s);
            return isNaN(n) ? 0 : n;
        }
        return 0;
    };

    // Calcular totales sobre filas filtradas (no sólo la página actual)
    // Detectar columnas numéricas (al menos un valor válido) en filas filtradas
    const numericMap = React.useMemo(() => {
        const map: Record<string, boolean> = {};
        const sampleRows = filteredRows;
        const keys = (columns || []).map((c: any) => String(c.accessorKey || c.id)).filter(Boolean);
        keys.forEach(k => {
            const hasNumeric = sampleRows.some(r => {
                const n = toNumber(r?.[k]);
                return !isNaN(n) && n !== 0; // considera >0 como evidencia de numérico
            });
            map[k] = hasNumeric;
        });
        return map;
    }, [filteredRows, columns]);

    const totals = React.useMemo(() => {
        const out: Record<string, number> = {};
        summaryKeys.forEach((key) => {
            if (!numericMap[key]) return; // saltar no numéricos
            out[key] = filteredRows.reduce((sum: number, row: any) => sum + toNumber(row?.[key]), 0);
        });
        return out;
    }, [filteredRows, summaryKeys, numericMap]);

    const columnOptions = React.useMemo(() => {
        return (columns || []).map((c: any) => {
            const key = String(c.accessorKey || c.id);
            const header = typeof c.header === 'string' ? c.header : key;
            return { value: key, label: header };
        });
    }, [columns]);

    // Calcular estadísticas de selección para filas filtradas
    const getSelectionStats = () => {
        if (!tableInstance) {
            return { selected: selectedRows.size, total: data.length, filteredSelected: selectedRows.size, filteredTotal: data.length };
        }

        const filteredRows = tableInstance.getFilteredRowModel().rows;
        const filteredIds = filteredRows.map((row: any) => String(row.original[rowIdField]));
        const filteredSelected = filteredIds.filter((id: string) => selectedRows.has(id)).length;

        return {
            selected: selectedRows.size,
            total: data.length,
            filteredSelected,
            filteredTotal: filteredIds.length
        };
    };

    const handleHistorial = () => {
        var historialId = "";
        if (tipoReporte === 'reporte1') {
            historialId = "1";
        } else if (tipoReporte === 'reporte2') {
            historialId = "2";
        } else if (tipoReporte === 'reporte3') {
            historialId = "3";
        }
        setHistorialId(historialId);
        setHistorialLabel(`Asignar Factura`);
        setHistorialOpen(true);
    };

    const message = (title: string, description: string, variant: "default" | "destructive" | "success" | "warning" | "error") => {
        toast({
            title: title,
            description: description,
            variant: variant,
        });
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    className="max-h-[95vh] overflow-y-auto"
                    style={{ maxWidth: maxWidth }}
                >
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                    </DialogHeader>

                    <div className="flex justify-between items-center mb-2">
                        {showCheckboxes && (
                            <div className="text-sm text-gray-600">
                                {(() => {
                                    const stats = getSelectionStats();
                                    if (stats.filteredTotal === stats.total) {
                                        return `${stats.selected} de ${stats.total} filas seleccionadas`;
                                    } else {
                                        return `${stats.filteredSelected} de ${stats.filteredTotal} filas visibles seleccionadas (${stats.selected} total)`;
                                    }
                                })()}
                            </div>
                        )}

                        <div className="flex gap-2 ml-auto">
                            {showAssignInvoice && (
                                <Button
                                    type="button"
                                    onClick={handleAssignInvoiceClick}
                                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow"
                                    disabled={selectedRows.size === 0}
                                >
                                    <Receipt className="h-5 w-5" />
                                    Asignar Factura ({selectedRows.size})
                                </Button>
                            )}

                            {showAssignInvoiceExterna && (
                                <Button
                                    type="button"
                                    onClick={handleAssignInvoiceExtClick}
                                    className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 shadow"
                                    disabled={selectedRows.size === 0}
                                >
                                    <Receipt className="h-5 w-5" />
                                    Asignar Factura Externa ({selectedRows.size})
                                </Button>
                            )}

                            {showCreateExternalCertificates && (
                                <Button
                                    type="button"
                                    onClick={() => setExternalCertDialogOpen(true)}
                                    className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 shadow"
                                    disabled={selectedRows.size === 0}
                                >
                                    Crear Certificados Externas ({selectedRows.size})
                                </Button>
                            )}

                            <Button
                                type="button"
                                onClick={handleExportExcel}
                                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 shadow"
                            >
                                <FileSpreadsheet className="h-5 w-5" />
                                Descargar Excel
                            </Button>

                            {showAssignInvoice && (
                                <Button
                                    type="button"
                                    onClick={handleHistorial}
                                    variant="outline"
                                >
                                    <History className="h-5 w-5" />
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <DataTable
                            columns={columnsWithCheckbox}
                            data={dataForTable}
                            searchKey={searchKey}
                            searchPlaceholder={searchPlaceholder}
                            onTableInstanceChange={setTableInstance}
                            onFilteredDataChange={(rows) => setFilteredRows(rows as any[])}
                        />
                    </div>

                    {/* Resumen de sumatorias para columnas seleccionadas (considera filtros) */}
                    <div className="mt-3 p-3 border rounded bg-gray-50">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                            <Label className="text-sm text-gray-700">Sumar columnas:</Label>
                            <div className="min-w-[240px]">
                                <SelectMultiple
                                    options={columnOptions}
                                    value={summaryKeys}
                                    onChange={(vals: string[]) => setSummaryKeys(vals)}
                                    placeholder="Selecciona columnas..."
                                    isFilter={false}
                                />
                            </div>
                        </div>

                        {summaryKeys.length > 0 && (
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {summaryKeys.map((key) => {
                                    const label = columnOptions.find(o => o.value === key)?.label || key;
                                    const isNumeric = numericMap[key];
                                    const value = totals[key] ?? 0;
                                    const isCurrency = isNumeric && CURRENCY_KEYS.has(key);
                                    return (
                                        <div key={key} className="rounded border bg-white p-2">
                                            <div className="text-xs text-gray-500 flex justify-between items-center">
                                                <span>{label}</span>
                                                {!isNumeric && <span className="text-[10px] px-1 py-0.5 bg-gray-200 rounded">No numérico</span>}
                                            </div>
                                            <div className="text-base font-semibold">
                                                {isNumeric ? (isCurrency ? currencyFormatter.format(value) : value.toLocaleString('es-CO')) : '—'}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={externalCertDialogOpen} onOpenChange={setExternalCertDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Crear Certificados Externas</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div><Label htmlFor="external-cert-number">Número de certificado</Label><Input id="external-cert-number" value={externalCertNumber} onChange={e => setExternalCertNumber(e.target.value)} /></div>
                        <div><Label htmlFor="external-cert-date">Fecha</Label><Input id="external-cert-date" type="date" value={externalCertDate} onChange={e => setExternalCertDate(e.target.value)} /></div>
                        <div><Label htmlFor="external-cert-file">Documento PDF</Label><Input id="external-cert-file" type="file" accept="application/pdf" onChange={e => setExternalCertFile(e.target.files?.[0] || null)} /></div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setExternalCertDialogOpen(false)}>Cancelar</Button>
                        <Button type="button" disabled={!externalCertNumber || !externalCertDate || !externalCertFile} onClick={() => { if (externalCertFile) onCreateExternalCertificates?.(getSelectedRows(), externalCertNumber, externalCertDate, externalCertFile); setExternalCertDialogOpen(false); setExternalCertNumber(""); setExternalCertDate(""); setExternalCertFile(null); }}>Crear certificados</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Diálogo para asignar factura */}
            <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Asignar Número de Factura</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="text-sm text-gray-600">
                            Se asignará la factura a {selectedRows.size} registro(s) seleccionado(s).
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="invoice-number">Número de Factura</Label>
                            <Input
                                id="invoice-number"
                                type="text"
                                placeholder="Ej: FAC-2025-001"
                                value={invoiceNumber}
                                onChange={(e) => setInvoiceNumber(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="invoice-date">Fecha de Factura</Label>
                            <Input
                                id="invoice-date"
                                type="date"
                                value={invoiceDate}
                                onChange={(e) => setInvoiceDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setInvoiceDialogOpen(false);
                                setInvoiceNumber("");
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={handleConfirmAssignInvoice}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Asignar Factura
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Diálogo para asignar factura externa */}
            <Dialog open={invoiceExtDialogOpen} onOpenChange={setInvoiceExtDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Asignar Número de Factura Externa</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="text-sm text-gray-600">
                            Se asignará la factura externa a {selectedRows.size} registro(s) seleccionado(s).
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="invoice-ext-number">Número de Factura Externa</Label>
                            <Input
                                id="invoice-ext-number"
                                type="text"
                                placeholder="Ej: FE-2025-001"
                                value={invoiceExtNumber}
                                onChange={(e) => setInvoiceExtNumber(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="invoice-ext-date">Fecha de Factura Externa</Label>
                            <Input
                                id="invoice-ext-date"
                                type="date"
                                value={invoiceExtDate}
                                onChange={(e) => setInvoiceExtDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => { setInvoiceExtDialogOpen(false); setInvoiceExtNumber(""); }}>
                            Cancelar
                        </Button>
                        <Button type="button" onClick={handleConfirmAssignInvoiceExt} className="bg-purple-600 hover:bg-purple-700">
                            Asignar Factura Externa
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <HistorialDialog
                open={historialOpen}
                onOpenChange={setHistorialOpen}
                tipo="AsignarFactura"
                id={historialId}
                label={historialLabel}
            />
        </>
    );
}