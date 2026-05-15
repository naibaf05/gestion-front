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
import { DataTable } from "@/components/ui/data-table";
import { FileSpreadsheet } from "lucide-react";
import { exportToExcel } from "@/lib/exportExcel";

interface GenericTableDialogProps<TData, TValue> {
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
}

export function GenericTableDialog<TData, TValue>({
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
}: GenericTableDialogProps<TData, TValue>) {
    const handleExportExcel = async () => {
        const keys = exportColumns && exportColumns.length > 0
            ? exportColumns
            : columns.filter((col: any) => col.id !== "actions").map((col: any) => col.accessorKey || col.id);

        const hdrs = exportHeaders && exportHeaders.length === keys.length
            ? exportHeaders
            : keys;

        await exportToExcel({ keys, headers: hdrs, data: data as any[], title });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-h-[95vh] overflow-y-auto"
                style={{ maxWidth: maxWidth }}
            >
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="flex justify-end mb-2">
                    <Button type="button" onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 shadow">
                        <FileSpreadsheet className="h-5 w-5" />
                        Descargar Excel
                    </Button>
                </div>
                <div className="overflow-x-auto">
                    <DataTable
                        columns={columns}
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
    );
}
