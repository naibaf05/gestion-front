"use client";

import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import { FileSpreadsheet, Receipt } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Checkbox } from "@/components/ui/checkbox";
import { SelectMultiple } from "@/components/ui/select-multiple";

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
    onAssignInvoice?: (selectedRows: TData[], invoiceNumber: string) => void; // callback para asignar factura
    rowIdField?: string; // campo que actúa como ID único para cada fila (ej: "id", "codigo")
    checkboxColumnWidth?: string; // ancho de la columna de selección (ej: "40px")
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
}: ReportDialogProps<TData, TValue>) {
    // Constante configurable para el ancho de la columna de checks
    const DEFAULT_CHECK_COL_WIDTH = "100px";
    const checkColWidth = checkboxColumnWidth || DEFAULT_CHECK_COL_WIDTH;
    // Estados para los checkboxes
    const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set());
    const [selectAll, setSelectAll] = React.useState(false);
    const [tableInstance, setTableInstance] = React.useState<any>(null);

    // Estados para el diálogo de asignar factura
    const [invoiceDialogOpen, setInvoiceDialogOpen] = React.useState(false);
    const [invoiceNumber, setInvoiceNumber] = React.useState("");

    // Estado para sumar columnas
    const [summaryKeys, setSummaryKeys] = React.useState<string[]>([]);
    const [filteredRows, setFilteredRows] = React.useState<any[]>(data);

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

    // Crear columnas con checkbox si es necesario
    const columnsWithCheckbox = React.useMemo(() => {
        if (!showCheckboxes) return columns;

        const checkboxColumn = {
            id: "select",
            width: checkColWidth,
            header: ({ table }: any) => {
                // Calcular el estado del checkbox basado en filas filtradas
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

        return [checkboxColumn, ...columns];
    }, [columns, showCheckboxes, selectedRows, selectAll, data, rowIdField]);

    // Manejar exportación a Excel
    const handleExportExcel = () => {
        const keys = exportColumns && exportColumns.length > 0
            ? exportColumns
            : columns.filter((col: any) => col.id !== "actions").map((col: any) => col.accessorKey || col.id);

        const headers = exportHeaders && exportHeaders.length === keys.length
            ? exportHeaders
            : keys;

        const exportData = data.map((row: any) => {
            const obj: any = {};
            keys.forEach((key: string, idx: number) => {
                const value = key.split(".").reduce((acc: any, k: string) => acc?.[k], row);
                obj[headers[idx]] = value;
            });
            return obj;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Datos");
        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), `${title.toLocaleLowerCase().replace(/\s+/g, "_")}.xlsx`);
    };

    // Manejar asignación de factura
    const handleAssignInvoiceClick = () => {
        if (selectedRows.size === 0) {
            alert("Por favor selecciona al menos una fila para asignar factura.");
            return;
        }
        setInvoiceDialogOpen(true);
    };

    // Confirmar asignación de factura
    const handleConfirmAssignInvoice = () => {
        if (!invoiceNumber.trim()) {
            alert("Por favor ingresa un número de factura.");
            return;
        }

        // Obtener las filas seleccionadas
        const selectedRowsData = data.filter((row: any) =>
            selectedRows.has(String(row[rowIdField]))
        );

        // Llamar al callback
        onAssignInvoice?.(selectedRowsData, invoiceNumber.trim());

        // Limpiar y cerrar
        setInvoiceNumber("");
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
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <DataTable
                            columns={columnsWithCheckbox}
                            data={data}
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
                                    return (
                                        <div key={key} className="rounded border bg-white p-2">
                                            <div className="text-xs text-gray-500 flex justify-between items-center">
                                                <span>{label}</span>
                                                {!isNumeric && <span className="text-[10px] px-1 py-0.5 bg-gray-200 rounded">No numérico</span>}
                                            </div>
                                            <div className="text-base font-semibold">
                                                {isNumeric ? value.toLocaleString('es-CO') : '—'}
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
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleConfirmAssignInvoice();
                                    }
                                }}
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
        </>
    );
}