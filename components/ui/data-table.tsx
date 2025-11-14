"use client";

import * as React from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  type SortingState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { SelectMultiple } from "./select-multiple";

declare module "@tanstack/react-table" {
  interface ColumnDefBase<TData, TValue> {
    width?: string; // Ancho de la columna en porcentaje (ej: "20%", "150px", "auto")
  }
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string | string[];
  searchPlaceholder?: string;
  onTableInstanceChange?: (table: any) => void; // Callback para exponer la instancia de la tabla
  onFilteredDataChange?: (rows: TData[]) => void; // Nuevo callback para pasar filas filtradas (antes de paginación)
  layoutMode?: 'auto' | 'fixed'; // modo de layout de la tabla
  minColWidth?: number; // sobreescribir min col width
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Buscar...",
  onTableInstanceChange,
  onFilteredDataChange,
  layoutMode = 'auto',
  minColWidth,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pageSize, setPageSize] = React.useState(5);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [searchValue, setSearchValue] = React.useState("");
  const [columnFilters, setColumnFilters] = React.useState<{ [key: string]: string | string[] }>({});

  const filteredData = React.useMemo(() => {
    let filtered = data;

    // Filtro global
    if (searchValue && searchKey) {
      const keys = Array.isArray(searchKey) ? searchKey : [searchKey];
      filtered = filtered.filter((row) =>
        keys.some((key) => {
          const value = key.split('.').reduce((acc: any, k) => acc?.[k], row);
          return value?.toString().toLowerCase().includes(searchValue.toLowerCase());
        })
      );
    }

    // Filtros por columna
    Object.entries(columnFilters).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        filtered = filtered.filter((row) => {
          const cellValue = key.split('.').reduce((acc: any, k) => acc?.[k], row);
          return value.includes(cellValue);
        });
      } else if (typeof value === "string" && value) {
        filtered = filtered.filter((row) => {
          const cellValue = key.split('.').reduce((acc: any, k) => acc?.[k], row);
          return cellValue?.toString().toLowerCase().includes(value.toLowerCase());
        });
      }
    });

    return filtered;
  }, [data, searchValue, searchKey, columnFilters]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
  });

  const totalRows = filteredData.length;
  const totalPages = Math.ceil(totalRows / pageSize);
  const paginatedRows = table.getRowModel().rows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  React.useEffect(() => {
    setPageIndex(0);
  }, [pageSize, sorting, data]);

  // Exponer la instancia de la tabla al componente padre
  React.useEffect(() => {
    if (onTableInstanceChange) {
      onTableInstanceChange(table);
    }
  }, [table, onTableInstanceChange]);

  // Reportar filas filtradas al padre para cálculos (sumatorias, etc.)
  React.useEffect(() => {
    if (onFilteredDataChange) {
      onFilteredDataChange(filteredData);
    }
  }, [filteredData, onFilteredDataChange]);
  // Valor mínimo por defecto para columnas sin ancho explícito
  const DEFAULT_MIN_COL_WIDTH = typeof minColWidth === 'number' ? minColWidth : 120; // px

  // Preparar colgroup para widths explícitos (mejor soporte en layout auto y fixed)
  const colGroupSpecs = React.useMemo(() => {
    return columns.map((c: any) => {
      const w = c.width as string | undefined;
      if (!w) return { width: undefined };
      const isPercent = /%$/.test(w);
      const isPx = /px$/.test(w);
      const isNumber = /^\d+$/.test(w);
      if (!(isPercent || isPx || isNumber)) {
        console.warn(`[DataTable] width inválido (${w}) en columna`, c);
        return { width: undefined };
      }
      // Normalizar número sin unidad a px
      const normalized = isNumber ? `${w}px` : w;
      return { width: normalized };
    });
  }, [columns]);

  return (
    <div className="space-y-4">
      {searchKey && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 gap-2">
          <div className="relative flex-1 max-w-sm p-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      )}
      <div className="rounded-md border bg-white overflow-x-auto">
        <Table className={`w-full ${layoutMode === 'fixed' ? 'table-fixed' : ''}`}>
          <colgroup>
            {colGroupSpecs.map((spec, idx) => (
              <col key={idx} style={spec.width ? { width: spec.width } : undefined} />
            ))}
          </colgroup>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup: any) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header: any) => {
                  const colKey = header.column.columnDef.accessorKey || header.column.id;
                  const columnWidth = header.column.columnDef.width as string | undefined;
                  const columnStyle: React.CSSProperties = {};

                  if (columnWidth) {
                    if (/%$/.test(columnWidth)) {
                      columnStyle.width = columnWidth;
                      // En fixed layout el porcentaje ya se reparte; mantenemos minWidth sólo en auto
                      if (layoutMode === 'auto') {
                        columnStyle.minWidth = `${DEFAULT_MIN_COL_WIDTH}px`;
                      }
                    } else {
                      columnStyle.width = columnWidth;
                      columnStyle.minWidth = columnWidth;
                      columnStyle.maxWidth = columnWidth; // evitar expansión por contenido (px)
                    }
                  } else {
                    columnStyle.minWidth = `${DEFAULT_MIN_COL_WIDTH}px`;
                  }

                  return (
                    <TableHead
                      key={header.id}
                      className="bg-gray-50 text-gray-700 font-semibold overflow-visible"
                      style={columnStyle}
                    >
                      <div className="flex flex-col gap-1">
                        <span className="px-3 truncate" title={typeof header.column.columnDef.header === 'string' ? header.column.columnDef.header : undefined}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        </span>
                        {header.column.columnDef.enableColumnFilter && colKey !== "actions" && (
                          (() => {
                            const uniqueValues = Array.from(
                              new Set(data.map((row: any) => {
                                const v = colKey.split('.').reduce((acc: any, k: string) => acc?.[k], row);
                                return v ?? "";
                              }))
                            ).filter(v => v !== "");

                            if (uniqueValues.length > 0 && uniqueValues.length <= 20) {
                              return (
                                <div className="mt-1 w-full">
                                  <SelectMultiple
                                    options={uniqueValues.map((v) => ({ label: v, value: v }))}
                                    value={Array.isArray(columnFilters[colKey]) ? columnFilters[colKey] : []}
                                    onChange={(vals) => setColumnFilters(f => ({ ...f, [colKey]: vals }))}
                                    placeholder="Filtrar..."
                                    isFilter={true}
                                  />
                                </div>
                              );
                            }
                            return (
                              <input
                                type="text"
                                value={columnFilters[colKey] || ""}
                                onChange={e => setColumnFilters(f => ({ ...f, [colKey]: e.target.value }))}
                                placeholder={`Filtrar...`}
                                className="mt-1 px-2 py-1 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary w-full"
                              />
                            );
                          })()
                        )}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {paginatedRows.length ? (
              paginatedRows.map((row: any) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {row.getVisibleCells().map((cell: any) => {
                    const columnWidth = cell.column.columnDef.width as string | undefined;
                    const cellStyle: React.CSSProperties = {};
                    if (columnWidth) {
                      if (/%$/.test(columnWidth)) {
                        cellStyle.width = columnWidth;
                        if (layoutMode === 'auto') {
                          cellStyle.minWidth = `${DEFAULT_MIN_COL_WIDTH}px`;
                        }
                      } else {
                        cellStyle.width = columnWidth;
                        cellStyle.minWidth = columnWidth;
                        cellStyle.maxWidth = columnWidth;
                      }
                    } else {
                      cellStyle.minWidth = `${DEFAULT_MIN_COL_WIDTH}px`;
                    }
                    return (
                      <TableCell
                        key={cell.id}
                        className="align-middle truncate"
                        style={cellStyle}
                      >
                        <div className="truncate" title={(() => {
                          const rendered = flexRender(cell.column.columnDef.cell, cell.getContext());
                          return typeof rendered === 'string' ? rendered : undefined;
                        })()}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 sm:space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          Total Registros: <span className="font-semibold text-gray-900">{data.length}</span>
        </div>
        <div className="flex items-center space-x-2">
          <select
            id="pageSize"
            className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
            <option value={25}>25</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
            disabled={pageIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <span className="text-sm">
            Página <span className="font-semibold text-gray-900">{pageIndex + 1}</span> de <span className="font-semibold text-gray-900">{totalPages || 1}</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageIndex((prev) => Math.min(prev + 1, totalPages - 1))}
            disabled={pageIndex >= totalPages - 1}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}