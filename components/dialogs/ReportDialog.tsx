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
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
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
    showAssignInvoice?: boolean; // nueva prop para mostrar botón de asignar factura
    onAssignInvoice?: (selectedRows: TData[], invoiceNumber: string, invoiceDate?: string) => void; // callback para asignar factura con fecha
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
    rowIdField = "id",
    checkboxColumnWidth,
    tipoReporte,
}: ReportDialogProps<TData, TValue>) {
    const { toast } = useToast();
    // Constante configurable para el ancho de la columna de checks
    const DEFAULT_CHECK_COL_WIDTH = "100px";
    const checkColWidth = checkboxColumnWidth || DEFAULT_CHECK_COL_WIDTH;
    // Columnas consideradas monetarias para formatear sumatorias
    const CURRENCY_KEYS = React.useMemo(() => new Set(["valor", "tarifa"]), []);
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
    // Filtro para mostrar sólo registros sin número de factura
    const [showOnlyWithoutFactura, setShowOnlyWithoutFactura] = React.useState(false);
    // Filtro para mostrar sólo registros sin fecha de factura
    const [showOnlyWithoutFecFactura, setShowOnlyWithoutFecFactura] = React.useState(false);

    // Estado para sumar columnas
    const [summaryKeys, setSummaryKeys] = React.useState<string[]>([]);
    const [filteredRows, setFilteredRows] = React.useState<any[]>(data);

    const [historialOpen, setHistorialOpen] = React.useState(false);
    const [historialId, setHistorialId] = React.useState<string>("");
    const [historialLabel, setHistorialLabel] = React.useState<string>("");

    // Efecto para limpiar selecciones cuando se cierra el diálogo
    React.useEffect(() => {
        if (!open) {
            setSelectedRows(new Set());
            setSelectAll(false);
            setInvoiceNumber("");
        }
    }, [open]);

    // Inicializar columnas a sumar por defecto cuando cambian las columnas
    React.useEffect(() => {
        const colKeys = (columns || []).map((c: any) => String(c.accessorKey || c.id)).filter(Boolean);
        const defaults: string[] = [];
        // Elegir sólo columnas numéricas por defecto
        const numericCandidates = ["cantidadKg", "valor", "cantidad", "tarifa"];
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
            return col;
        });
        return working;
    }, [columns, showCheckboxes, selectedRows, selectAll, data, rowIdField, showOnlyWithoutFactura, showOnlyWithoutFecFactura, checkColWidth]);

    // Data filtrada según toggle de facturas vacías
    const dataForTable = React.useMemo(() => {
        const isEmpty = (v: any) => v == null || String(v).trim() === "";
        if (!showOnlyWithoutFactura && !showOnlyWithoutFecFactura) return data;
        return data.filter((r: any) => {
            let pass = true;
            if (showOnlyWithoutFactura) pass = pass && isEmpty(r?.numFactura);
            if (showOnlyWithoutFecFactura) pass = pass && isEmpty(r?.fecFactura);
            return pass;
        });
    }, [data, showOnlyWithoutFactura, showOnlyWithoutFecFactura]);

    // Mantener filteredRows sincronizado con dataForTable cuando cambia el filtro de factura vacía
    React.useEffect(() => {
        setFilteredRows(dataForTable);
    }, [dataForTable]);

    // Manejar exportación a Excel
    // Manejar exportación a Excel
    const handleExportExcel = async () => {
        const keys = exportColumns && exportColumns.length > 0
            ? exportColumns
            : columns.filter((col: any) => col.id !== "actions").map((col: any) => col.accessorKey || col.id);

        const headers = exportHeaders && exportHeaders.length === keys.length
            ? exportHeaders
            : keys;

        // Columns to treat as dates
        const DATE_KEYS = ["fecha", "clienteFechaRenovacion", "fechaCierreFacCliente", "fechaVisita", "fechaInicio", "fechaFin", "fecFactura"];

        // Helper: parse DD/MM/YYYY or YYYY-MM-DD to JS Date
        function parseDate(val: string): Date | null {
            if (!val || typeof val !== "string") return null;
            const m = val.match(/^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/);
            if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}`);
            const m2 = val.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/);
            if (m2) return new Date(`${m2[1]}-${m2[2]}-${m2[3]}`);
            return null;
        }

        // Create workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Datos');

        // Column widths
        var colWidths: any[] = [];
        keys.forEach((key: string, idx: number) => {
            const keyLower = key.toLowerCase();
            const headerText = (headers[idx] || key).toLowerCase();
            const combinedText = `${keyLower} ${headerText}`;

            if (combinedText.includes('correo') || combinedText.includes('mail') || combinedText.includes('email')) {
                colWidths.push({ width: 30 });
            } else if (combinedText.includes('direccion') || combinedText.includes('dirección')) {
                colWidths.push({ width: 35 });
            } else if (combinedText.includes('planta')) {
                colWidths.push({ width: 40 });
            } else if (combinedText.includes('nombre') || combinedText.includes('cliente') || combinedText.includes('sede') || combinedText.includes('salida') || combinedText.includes('destino')) {
                colWidths.push({ width: 25 });
            } else if (combinedText.includes('fecha') || combinedText.includes('fec') || DATE_KEYS.includes(key)) {
                colWidths.push({ width: 12 });
            } else if (combinedText.includes('nit')) {
                colWidths.push({ width: 15 });
            } else if (combinedText.includes('telefono') || combinedText.includes('teléfono')) {
                colWidths.push({ width: 15 });
            } else if (combinedText.includes('valor') || combinedText.includes('tarifa') || combinedText.includes('peso')) {
                colWidths.push({ width: 14 });
            } else if (combinedText.includes('cantidad') || combinedText.includes('kg') || combinedText.includes('m3')) {
                colWidths.push({ width: 12 });
            } else if (combinedText.includes('factura') || combinedText.includes('remision') || combinedText.includes('remisión')) {
                colWidths.push({ width: 16 });
            } else if (combinedText.includes('tipo') || combinedText.includes('unidad') || combinedText.includes('residuo') || combinedText.includes('producto') || combinedText.includes('recolector')) {
                colWidths.push({ width: 20 });
            } else if (combinedText.includes('barrio') || combinedText.includes('ciudad') || combinedText.includes('contacto')) {
                colWidths.push({ width: 18 });
            } else if (combinedText.includes('certificado') || combinedText.includes('cert')) {
                colWidths.push({ width: 16 });
            } else {
                colWidths.push({ width: 15 });
            }
        });
        worksheet.columns = colWidths;

        // Load and add logo
        try {
            const logoResponse = await fetch('/logo.png');
            const logoBlob = await logoResponse.blob();
            const logoArrayBuffer = await logoBlob.arrayBuffer();

            const imageId = workbook.addImage({
                buffer: logoArrayBuffer,
                extension: 'png',
            });

            // Position with margins using editAs absolute
            worksheet.addImage(imageId, {
                tl: { col: 1, row: 0.8 },
                ext: { width: 90, height: 40 },
                editAs: 'oneCell'
            });
        } catch (error) {
            console.error('Error loading logo:', error);
        }

        const logoCell = worksheet.getCell('A1');
        logoCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'DEE6E6' }
        };

        // Add and style title (B1 merged to last column)
        worksheet.mergeCells(1, 2, 1, keys.length);
        const titleCell = worksheet.getCell('B1');
        titleCell.value = title;
        titleCell.font = { name: 'Calibri', size: 18, bold: true, color: { argb: '000000' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        titleCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'DEE6E6' }
        };
        worksheet.getRow(1).height = 50;

        // Empty rows for spacing
        worksheet.getRow(2).height = 5;
        worksheet.getRow(3).height = 5;

        // Add headers (row 4)
        const headerRow = worksheet.getRow(4);
        headerRow.height = 30;

        // Style logo column header
        const logoHeaderCell = headerRow.getCell(1);
        logoHeaderCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'DEE6E6' }
        };
        logoHeaderCell.border = {
            top: { style: 'medium', color: { argb: 'FF1F4E78' } },
            left: { style: 'medium', color: { argb: 'FF1F4E78' } },
            bottom: { style: 'medium', color: { argb: 'FF1F4E78' } },
            right: { style: 'thin', color: { argb: '000000' } }
        };

        // Add data headers
        headers.forEach((header, idx) => {
            const cell = headerRow.getCell(idx + 1);
            cell.value = header;
            cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: '000000' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'DEE6E6' }
            };
            cell.border = {
                top: { style: 'medium', color: { argb: 'FF1F4E78' } },
                left: { style: 'thin', color: { argb: '000000' } },
                bottom: { style: 'medium', color: { argb: 'FF1F4E78' } },
                right: { style: 'thin', color: { argb: '000000' } }
            };
        });

        // Add data rows
        const exportData = showOnlyWithoutFactura || showOnlyWithoutFecFactura ? dataForTable : data;
        exportData.forEach((row: any, rowIdx: number) => {
            const excelRow = worksheet.getRow(rowIdx + 5);

            keys.forEach((key: string, colIdx: number) => {
                const cell = excelRow.getCell(colIdx + 1);
                let value = key.split(".").reduce((acc: any, k: string) => acc?.[k], row);

                // Handle dates
                if (DATE_KEYS.includes(key) && typeof value === "string") {
                    const d = parseDate(value);
                    if (d) {
                        cell.value = d;
                        cell.numFmt = 'dd/mm/yyyy';
                    } else {
                        cell.value = value;
                    }
                } else {
                    cell.value = value;
                }

                // Format currency
                if (CURRENCY_KEYS.has(key)) {
                    cell.numFmt = '"$"#,##0.00';
                    cell.alignment = { horizontal: 'right', vertical: 'middle' };
                } else {
                    cell.alignment = { horizontal: 'left', vertical: 'middle' };
                }

                cell.font = { name: 'Calibri', size: 10 };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
                };

                // Alternate row colors
                if (rowIdx % 2 === 1) {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF8F9FA' }
                    };
                }
            });
        });

        // Generate and download file
        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer], { type: "application/octet-stream" }), `${title.toLocaleLowerCase().replace(/\s+/g, "_")}.xlsx`);
    };

    // Manejar asignación de factura
    const handleAssignInvoiceClick = () => {
        if (selectedRows.size === 0) {
            message("Error", "Por favor selecciona al menos una fila para asignar factura.", "error");
            return;
        }
        setInvoiceDialogOpen(true);
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