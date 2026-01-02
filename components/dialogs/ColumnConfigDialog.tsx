"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Settings } from "lucide-react"

interface ColumnConfig {
    key: string
    label: string
    category: 'cliente' | 'sede' | 'residuo' | 'visita' | 'otros' | 'salida' | 'destino'
    enabled: boolean
}

interface ColumnConfigDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    columns: ColumnConfig[]
    onConfirm: (selectedColumns: ColumnConfig[]) => void
}

const defaultColumns: ColumnConfig[] = [
    // Información de Cliente
    { key: "fecha", label: "Fecha", category: "cliente", enabled: true },
    { key: "nit", label: "NIT", category: "cliente", enabled: true },
    { key: "ciudad", label: "Ciudad", category: "cliente", enabled: true },
    { key: "numFactura", label: "Número de Factura", category: "cliente", enabled: true },
    { key: "valor", label: "Valor Facturado", category: "cliente", enabled: true },
    
    // Información de Sede
    { key: "planta", label: "Planta", category: "sede", enabled: true },
    { key: "sede", label: "Sede", category: "sede", enabled: true },
    { key: "direccion", label: "Dirección", category: "sede", enabled: true },
    
    // Información de Residuo
    { key: "tipoResiduo", label: "Tipo Residuo", category: "residuo", enabled: true },
    { key: "cantidadKg", label: "Cantidad KG", category: "residuo", enabled: true },
    { key: "cantidadM3", label: "Cantidad M3", category: "residuo", enabled: true },
    { key: "recolNombre", label: "Recolección", category: "residuo", enabled: true },
    { key: "tarifa", label: "Tarifa", category: "residuo", enabled: true },
]

export function ColumnConfigDialog({
    open,
    onOpenChange,
    columns = defaultColumns,
    onConfirm
}: ColumnConfigDialogProps) {
    const [selectedColumns, setSelectedColumns] = useState<ColumnConfig[]>(columns)

    useEffect(() => {
        if (open) {
            setSelectedColumns([...columns])
        }
    }, [open, columns])

    const handleColumnToggle = (columnKey: string, checked: boolean) => {
        setSelectedColumns(prev =>
            prev.map(col =>
                col.key === columnKey ? { ...col, enabled: checked } : col
            )
        )
    }

    const handleCategoryToggle = (category: string, checked: boolean) => {
        setSelectedColumns(prev =>
            prev.map(col =>
                col.category === category ? { ...col, enabled: checked } : col
            )
        )
    }

    const handleSelectAll = (checked: boolean) => {
        setSelectedColumns(prev =>
            prev.map(col => ({ ...col, enabled: checked }))
        )
    }

    const getCategoryStats = (category: string) => {
        const categoryColumns = selectedColumns.filter(col => col.category === category)
        const enabledCount = categoryColumns.filter(col => col.enabled).length
        return { enabled: enabledCount, total: categoryColumns.length }
    }

    const isCategoryFullySelected = (category: string) => {
        const stats = getCategoryStats(category)
        return stats.enabled === stats.total && stats.total > 0
    }

    const isCategoryPartiallySelected = (category: string) => {
        const stats = getCategoryStats(category)
        return stats.enabled > 0 && stats.enabled < stats.total
    }

    const groupedColumns = {
        sede: selectedColumns.filter(col => col.category === 'sede'),
        cliente: selectedColumns.filter(col => col.category === 'cliente'),
        visita: selectedColumns.filter(col => col.category === 'visita'),
        residuo: selectedColumns.filter(col => col.category === 'residuo'),
        salida: selectedColumns.filter(col => col.category === 'salida'),
        destino: selectedColumns.filter(col => col.category === 'destino'),
        otros: selectedColumns.filter(col => col.category === 'otros'),
    }

    const categoryLabels = {
        sede: "Información de Sede",
        cliente: "Información de Cliente",
        visita: "Información de Visita",
        residuo: "Información de Residuo",
        salida: "Información de Salida",
        destino: "Información de Destino",
        otros: "Otros"
    }

    const handleConfirm = () => {
        onConfirm(selectedColumns)
        onOpenChange(false)
    }

    const handleReset = () => {
        setSelectedColumns(defaultColumns.map(col => ({ ...col, enabled: true })))
    }

    const totalSelected = selectedColumns.filter(col => col.enabled).length
    const totalColumns = selectedColumns.length

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Configurar Columnas del Reporte
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-auto space-y-6 py-4">
                    {/* Controles globales */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="select-all"
                                checked={totalSelected === totalColumns}
                                onCheckedChange={handleSelectAll}
                            />
                            <Label htmlFor="select-all" className="font-medium">
                                Seleccionar todas ({totalSelected}/{totalColumns})
                            </Label>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleReset}>
                            Restablecer
                        </Button>
                    </div>

                    <div className="border-t border-gray-200"></div>

                    {/* Columnas por categoría */}
                    {Object.entries(groupedColumns).map(([category, cols]) => {
                        if (cols.length === 0) return null
                        
                        return (
                            <div key={category} className="space-y-3">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`category-${category}`}
                                        checked={isCategoryFullySelected(category)}
                                        onCheckedChange={(checked) => handleCategoryToggle(category, checked as boolean)}
                                        className={isCategoryPartiallySelected(category) ? "data-[state=checked]:bg-primary/50" : ""}
                                    />
                                    <Label htmlFor={`category-${category}`} className="font-medium text-base">
                                        {categoryLabels[category as keyof typeof categoryLabels]}
                                        <span className="ml-2 text-sm text-gray-500">
                                            ({getCategoryStats(category).enabled}/{getCategoryStats(category).total})
                                        </span>
                                    </Label>
                                </div>

                                <div className="grid grid-cols-2 gap-2 ml-6">
                                    {cols.map((column) => (
                                        <div key={column.key} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={column.key}
                                                checked={column.enabled}
                                                onCheckedChange={(checked) => handleColumnToggle(column.key, checked as boolean)}
                                            />
                                            <Label htmlFor={column.key} className="text-sm">
                                                {column.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>

                <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirm} className="bg-primary hover:bg-primary-hover">
                        Aplicar Configuración ({totalSelected} columnas)
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}