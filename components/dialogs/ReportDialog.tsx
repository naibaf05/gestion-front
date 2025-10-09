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
}: ReportDialogProps<TData, TValue>) {
    // Estados para los checkboxes
    const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set());
    const [selectAll, setSelectAll] = React.useState(false);
    
    // Estados para el diálogo de asignar factura
    const [invoiceDialogOpen, setInvoiceDialogOpen] = React.useState(false);
    const [invoiceNumber, setInvoiceNumber] = React.useState("");

    // Efecto para limpiar selecciones cuando se cierra el diálogo
    React.useEffect(() => {
        if (!open) {
            setSelectedRows(new Set());
            setSelectAll(false);
            setInvoiceNumber("");
        }
    }, [open]);

    // Manejar selección individual de filas
    const handleRowSelect = (rowId: string, checked: boolean) => {
        const newSelectedRows = new Set(selectedRows);
        if (checked) {
            newSelectedRows.add(rowId);
        } else {
            newSelectedRows.delete(rowId);
        }
        setSelectedRows(newSelectedRows);
        
        // Actualizar estado de "select all"
        setSelectAll(newSelectedRows.size === data.length && data.length > 0);
    };

    // Manejar selección de todas las filas
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = data.map((row: any) => String(row[rowIdField]));
            setSelectedRows(new Set(allIds));
        } else {
            setSelectedRows(new Set());
        }
        setSelectAll(checked);
    };

    // Crear columnas con checkbox si es necesario
    const columnsWithCheckbox = React.useMemo(() => {
        if (!showCheckboxes) return columns;

        const checkboxColumn = {
            id: "select",
            header: ({ table }: any) => (
                <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                    aria-label="Seleccionar todas las filas"
                />
            ),
            cell: ({ row }: any) => {
                const rowId = String(row.original[rowIdField]);
                return (
                    <Checkbox
                        checked={selectedRows.has(rowId)}
                        onCheckedChange={(checked) => handleRowSelect(rowId, checked as boolean)}
                        aria-label={`Seleccionar fila ${rowId}`}
                    />
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
                                {selectedRows.size} de {data.length} filas seleccionadas
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
                        />
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