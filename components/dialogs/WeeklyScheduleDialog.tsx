"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { ItemSelectorDialog } from "./ItemSelectorDialog"

interface ScheduleItem {
    id: string
    nombre: string
}

interface ScheduleCell {
    week: number
    day: string
    item?: ScheduleItem
}

interface WeeklyScheduleDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title?: string
    description?: string
    availableItems: ScheduleItem[]
    initialSchedule?: ScheduleCell[]
    onSave: (schedule: ScheduleCell[]) => void
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
    onSave,
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
    const getCellItem = (week: number, day: string): ScheduleItem | undefined => {
        const cell = schedule.find((cell) => cell.week === week && cell.day === day)
        return cell?.item
    }

    // Manejar clic en celda
    const handleCellClick = (week: number, day: string) => {
        setSelectedCell({ week, day })
        setShowItemSelector(true)
    }

    // Seleccionar elemento para la celda
    const handleItemSelect = (item: ScheduleItem) => {
        if (!selectedCell) return

        console.log("Seleccionando item:", item, "para celda:", selectedCell)

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
        const filledCells = schedule.filter((cell) => cell.item)
        onSave(filledCells)
        onOpenChange(false)
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>{description}</DialogDescription>
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
                                                                    className="h-full flex items-center justify-center bg-blue-50 rounded border border-blue-200 relative group cursor-pointer"
                                                                    onClick={() => handleCellClick(week, day.key)}
                                                                >
                                                                    <span className="text-xs text-center px-1 text-blue-800 font-medium">
                                                                        {item.nombre}
                                                                    </span>
                                                                    <button
                                                                        onClick={(e) => handleClearCell(week, day.key, e)}
                                                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    >
                                                                        <X className="w-2 h-2" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleCellClick(week, day.key)}
                                                                    className="w-full h-full border-2 border-dashed border-gray-300 rounded hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center"
                                                                >
                                                                    <span className="text-gray-400 text-xs">+</span>
                                                                </button>
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
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
                            Guardar Horario
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Diálogo selector de elementos */}
            <ItemSelectorDialog
                open={showItemSelector}
                onOpenChange={setShowItemSelector}
                title={selectedCell ? `Semana ${selectedCell.week} - ${selectedCell.day}` : "Seleccionar Elemento"}
                description="Selecciona un elemento para asignar a esta celda del horario"
                availableItems={availableItems}
                onItemSelect={handleItemSelect}
                selectDay={selectedCell?.day}
            />
        </>
    )
}