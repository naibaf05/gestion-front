import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const DATE_KEYS = [
    "fecha",
    "fechaRecibo",
    "clienteFechaRenovacion",
    "fechaCierreFacCliente",
    "fechaVisita",
    "fechaInicio",
    "fechaFin",
    "fecFactura",
];

const CURRENCY_KEYS = new Set(["valor", "tarifa"]);

function parseDate(val: string): Date | null {
    if (!val || typeof val !== "string") return null;
    const m = val.match(/^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/);
    if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}`);
    const m2 = val.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/);
    if (m2) return new Date(`${m2[1]}-${m2[2]}-${m2[3]}`);
    return null;
}

export interface ExportExcelParams {
    keys: string[];
    headers: string[];
    data: any[];
    title: string;
    /** Datos a exportar (puede ser diferente a data si hay filtros activos). Por defecto usa data. */
    exportData?: any[];
}

export async function exportToExcel({
    keys,
    headers,
    data,
    title,
    exportData,
}: ExportExcelParams): Promise<void> {
    const rowsToExport = exportData ?? data;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Datos");

    // Determinar anchos de columna según el contenido de la clave/encabezado
    const colWidths: any[] = keys.map((key, idx) => {
        const keyLower = key.toLowerCase();
        const headerText = (headers[idx] || key).toLowerCase();
        const combined = `${keyLower} ${headerText}`;

        if (combined.includes("correo") || combined.includes("mail") || combined.includes("email")) return { width: 30 };
        if (combined.includes("direccion") || combined.includes("dirección")) return { width: 35 };
        if (combined.includes("planta")) return { width: 40 };
        if (
            combined.includes("nombre") ||
            combined.includes("cliente") ||
            combined.includes("sede") ||
            combined.includes("salida") ||
            combined.includes("destino")
        ) return { width: 25 };
        if (combined.includes("fecha") || combined.includes("fec") || DATE_KEYS.includes(key)) return { width: 12 };
        if (combined.includes("nit")) return { width: 15 };
        if (combined.includes("telefono") || combined.includes("teléfono")) return { width: 15 };
        if (combined.includes("valor") || combined.includes("tarifa") || combined.includes("peso")) return { width: 14 };
        if (combined.includes("cantidad") || combined.includes("kg") || combined.includes("m3")) return { width: 12 };
        if (combined.includes("factura") || combined.includes("remision") || combined.includes("remisión")) return { width: 16 };
        if (
            combined.includes("tipo") ||
            combined.includes("unidad") ||
            combined.includes("residuo") ||
            combined.includes("producto") ||
            combined.includes("recolector")
        ) return { width: 20 };
        if (combined.includes("barrio") || combined.includes("ciudad") || combined.includes("contacto")) return { width: 18 };
        if (combined.includes("certificado") || combined.includes("cert")) return { width: 16 };
        return { width: 15 };
    });
    worksheet.columns = colWidths;

    // Logo
    try {
        const logoResponse = await fetch("/logo.png");
        const logoArrayBuffer = await (await logoResponse.blob()).arrayBuffer();
        const imageId = workbook.addImage({ buffer: logoArrayBuffer, extension: "png" });
        worksheet.addImage(imageId, {
            tl: { col: 1, row: 0.8 },
            ext: { width: 90, height: 40 },
            editAs: "oneCell",
        });
    } catch {
        // Logo opcional; continuar sin él
    }

    // Celda del logo (A1)
    worksheet.getCell("A1").fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "DEE6E6" },
    };

    // Título (B1 → última columna, fila 1)
    worksheet.mergeCells(1, 2, 1, keys.length);
    const titleCell = worksheet.getCell("B1");
    titleCell.value = title;
    titleCell.font = { name: "Calibri", size: 18, bold: true, color: { argb: "000000" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "DEE6E6" } };
    worksheet.getRow(1).height = 50;

    // Filas de espaciado
    worksheet.getRow(2).height = 5;
    worksheet.getRow(3).height = 5;

    // Encabezados (fila 4)
    const headerRow = worksheet.getRow(4);
    headerRow.height = 30;

    // Estilo celda logo en encabezado
    headerRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "DEE6E6" } };
    headerRow.getCell(1).border = {
        top: { style: "medium", color: { argb: "FF1F4E78" } },
        left: { style: "medium", color: { argb: "FF1F4E78" } },
        bottom: { style: "medium", color: { argb: "FF1F4E78" } },
        right: { style: "thin", color: { argb: "000000" } },
    };

    headers.forEach((header, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.value = header;
        cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "000000" } };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "DEE6E6" } };
        cell.border = {
            top: { style: "medium", color: { argb: "FF1F4E78" } },
            left: { style: "thin", color: { argb: "000000" } },
            bottom: { style: "medium", color: { argb: "FF1F4E78" } },
            right: { style: "thin", color: { argb: "000000" } },
        };
    });

    // Filas de datos (a partir de fila 5)
    rowsToExport.forEach((row: any, rowIdx: number) => {
        const excelRow = worksheet.getRow(rowIdx + 5);

        keys.forEach((key, colIdx) => {
            const cell = excelRow.getCell(colIdx + 1);
            const value = key.split(".").reduce((acc: any, k: string) => acc?.[k], row);

            if (DATE_KEYS.includes(key) && typeof value === "string") {
                const d = parseDate(value);
                if (d) {
                    cell.value = d;
                    cell.numFmt = "dd/mm/yyyy";
                } else {
                    cell.value = value;
                }
            } else {
                cell.value = value ?? null;
            }

            if (CURRENCY_KEYS.has(key)) {
                cell.numFmt = '"$"#,##0.00';
                cell.alignment = { horizontal: "right", vertical: "middle" };
            } else {
                cell.alignment = { horizontal: "left", vertical: "middle" };
            }

            cell.font = { name: "Calibri", size: 10 };
            cell.border = {
                top: { style: "thin", color: { argb: "FFD0D0D0" } },
                left: { style: "thin", color: { argb: "FFD0D0D0" } },
                bottom: { style: "thin", color: { argb: "FFD0D0D0" } },
                right: { style: "thin", color: { argb: "FFD0D0D0" } },
            };

            if (rowIdx % 2 === 1) {
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8F9FA" } };
            }
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
        new Blob([buffer], { type: "application/octet-stream" }),
        `${title.toLocaleLowerCase().replace(/\s+/g, "_")}.xlsx`
    );
}
