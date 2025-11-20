"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { ItemSelectorDialog } from "./ItemSelectorDialog"
import { InfoAdicional, Path } from "@/types"

interface ScheduleCell {
    week: number
    day: string
    item?: Path
}

interface WeeklyScheduleDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title?: string
    description?: string
    availableItems: Path[]
    initialSchedule?: ScheduleCell[]
    infoAdicional?: InfoAdicional
    onSave: (schedule: ScheduleCell[]) => void
    readOnly?: boolean
}

const DAYS = [
    { key: "l", label: "L" },
    { key: "m", label: "M" },
    { key: "x", label: "X" },
    { key: "j", label: "J" },
    { key: "v", label: "V" },
    { key: "s", label: "S" },
    { key: "d", label: "D" },
]

const WEEKS = [1, 2, 3, 4]

export function WeeklyScheduleDialog({
    open,
    onOpenChange,
    title = "Horario Semanal",
    description = "Configura el horario semanal seleccionando elementos para cada día",
    availableItems,
    initialSchedule = [],
    infoAdicional,
    onSave,
    readOnly = false,
}: WeeklyScheduleDialogProps) {
    const [schedule, setSchedule] = useState<ScheduleCell[]>([])
    const [selectedCell, setSelectedCell] = useState<{ week: number; day: string } | null>(null)
    const [showItemSelector, setShowItemSelector] = useState(false)

    // Inicializar el horario
    useEffect(() => {
        if (open) {
            const initialCells: ScheduleCell[] = []
            WEEKS.forEach((week) => {
                DAYS.forEach((day) => {
                    const existingCell = initialSchedule.find((cell) => cell.week === week && cell.day === day.key)
                    initialCells.push({
                        week,
                        day: day.key,
                        item: existingCell?.item,
                    })
                })
            })
            setSchedule(initialCells)
        }
    }, [open, initialSchedule])

    // Obtener elemento de una celda específica
    const getCellItem = (week: number, day: string): Path | undefined => {
        const cell = schedule.find((cell) => cell.week === week && cell.day === day)
        return cell?.item
    }

    // Manejar clic en celda
    const handleCellClick = (week: number, day: string) => {
        if (readOnly) return
        setSelectedCell({ week, day })
        setShowItemSelector(true)
    }

    // Seleccionar elemento para la celda
    const handleItemSelect = (item: Path) => {
        if (readOnly) return
        if (!selectedCell) return

        setSchedule((prev) =>
            prev.map((cell) => {
                if (cell.week === selectedCell.week && cell.day === selectedCell.day) {
                    return { ...cell, item }
                }
                return cell
            }),
        )

        // Limpiar selección
        setSelectedCell(null)
    }

    // Limpiar celda
    const handleClearCell = (week: number, day: string, event: React.MouseEvent) => {
        if (readOnly) return
        event.stopPropagation()

        setSchedule((prev) =>
            prev.map((cell) => {
                if (cell.week === week && cell.day === day) {
                    return { ...cell, item: undefined }
                }
                return cell
            }),
        )
    }

    // Guardar horario
    const handleSave = () => {
        if (readOnly) {
            onOpenChange(false)
            return
        }
        const filledCells = schedule.filter((cell) => cell.item)
        onSave(filledCells)
        onOpenChange(false)
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{title}  -  [Semana {infoAdicional?.semanaActual}]</DialogTitle>
                        <DialogDescription>{readOnly ? "Visualización del horario semanal" : description}</DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-auto">
                        {/* Tabla de horarios */}
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="border p-3 text-center font-medium text-gray-700 w-20">Semana</th>
                                        {DAYS.map((day) => (
                                            <th key={day.key} className="border p-3 text-center font-medium text-gray-700 w-24">
                                                {day.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {WEEKS.map((week) => (
                                        <tr key={week}>
                                            <td className="border p-3 text-center font-medium bg-gray-50">{week}</td>
                                            {DAYS.map((day) => {
                                                const item = getCellItem(week, day.key)
                                                return (
                                                    <td key={`${week}-${day.key}`} className="border p-1 h-16">
                                                        <div className="relative h-full">
                                                            {item ? (
                                                                <div
                                                                    className={`h-full flex items-center justify-center rounded border relative group ${readOnly ? 'bg-gray-50 border-gray-200 cursor-default' : 'bg-blue-50 border-blue-200 cursor-pointer'}`}
                                                                    onClick={() => !readOnly && handleCellClick(week, day.key)}
                                                                >
                                                                    <span className={`text-xs text-center px-1 font-medium ${readOnly ? 'text-gray-700' : 'text-blue-800'}`}>
                                                                        {item.nombre}
                                                                    </span>
                                                                    {!readOnly && (
                                                                        <button
                                                                            onClick={(e) => handleClearCell(week, day.key, e)}
                                                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        >
                                                                            <X className="w-2 h-2" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                readOnly ? (
                                                                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-300">-</div>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleCellClick(week, day.key)}
                                                                        className="w-full h-full border-2 border-dashed border-gray-300 rounded hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center"
                                                                    >
                                                                        <span className="text-gray-400 text-xs">+</span>
                                                                    </button>
                                                                )
                                                            )}
                                                        </div>
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            {readOnly ? 'Cerrar' : 'Cancelar'}
                        </Button>
                        {!readOnly && (
                            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
                                Guardar Horario
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Diálogo selector de elementos */}
            {!readOnly && (
                <ItemSelectorDialog
                    open={showItemSelector}
                    onOpenChange={setShowItemSelector}
                    title={selectedCell ? `Semana ${selectedCell.week} - ${selectedCell.day}` : "Seleccionar Elemento"}
                    description="Selecciona un elemento para asignar a esta celda del horario"
                    availableItems={availableItems}
                    onItemSelect={handleItemSelect}
                    selectDay={selectedCell?.day}
                />
            )}
        </>
    )
}