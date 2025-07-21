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
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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
}: GenericTableDialogProps<TData, TValue>) {
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="flex justify-end mb-2">
                    <Button type="button" onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 shadow">
                        <FileSpreadsheet className="h-5 w-5" />
                        Descargar Excel
                    </Button>
                </div>
                <div>
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
