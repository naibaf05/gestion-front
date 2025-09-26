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
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Buscar...",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pageSize, setPageSize] = React.useState(10);
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
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup: any) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header: any) => {
                  const colKey = header.column.columnDef.accessorKey || header.column.id;
                  const columnWidth = header.column.columnDef.width;

                  const columnStyle = {
                    width: columnWidth || "auto",
                    maxWidth: columnWidth || "200px"
                  };

                  return (
                    <TableHead
                      key={header.id}
                      className="bg-gray-50 text-gray-700 font-semibold"
                      style={columnStyle}
                    >
                      <div className="flex flex-col gap-1">
                        <span className="px-3">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        </span>
                        {header.column.columnDef.enableColumnFilter && colKey !== "actions" && (
                          (() => {
                            // Obtener valores únicos para la columna
                            const uniqueValues = Array.from(
                              new Set(data.map((row: any) => {
                                const v = colKey.split('.').reduce((acc: any, k: string) => acc?.[k], row);
                                return v ?? "";
                              }))
                            ).filter(v => v !== "");

                            // Si hay pocos valores únicos, usar select, si no, input
                            if (uniqueValues.length > 0 && uniqueValues.length <= 20) {
                              return (
                                <SelectMultiple
                                  options={uniqueValues.map((v) => ({ label: v, value: v }))}
                                  value={Array.isArray(columnFilters[colKey]) ? columnFilters[colKey] : []}
                                  onChange={(vals) => setColumnFilters(f => ({ ...f, [colKey]: vals }))}
                                  placeholder="Filtrar..."
                                  isFilter={true}
                                />
                              );
                            }
                            return (
                              <input
                                type="text"
                                value={columnFilters[colKey] || ""}
                                onChange={e => setColumnFilters(f => ({ ...f, [colKey]: e.target.value }))}
                                placeholder={`Filtrar...`}
                                className="mt-1 px-2 py-1 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary"
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
                    const columnWidth = cell.column.columnDef.width;
                    const cellStyle = {
                      width: columnWidth || "auto",
                      maxWidth: columnWidth || "200px"
                    };

                    return (
                      <TableCell
                        key={cell.id}
                        className="align-middle"
                        style={cellStyle}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
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