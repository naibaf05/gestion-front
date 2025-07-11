"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { Path } from "@/types"


interface ItemSelectorDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description?: string
    availableItems: Path[]
    onItemSelect: (item: Path) => void
    selectDay?: string
}

export function ItemSelectorDialog({
    open,
    onOpenChange,
    title,
    availableItems,
    onItemSelect,
    selectDay,
}: ItemSelectorDialogProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const searchInputRef = useRef<HTMLInputElement>(null)

    // Auto-focus en el input de búsqueda cuando se abre
    useEffect(() => {
        if (open && searchInputRef.current) {
            setTimeout(() => {
                searchInputRef.current?.focus()
            }, 100)
        }
    }, [open])

    // Limpiar búsqueda al abrir
    useEffect(() => {
        if (open) {
            setSearchTerm("")
        }
    }, [open])

    // Filtrar elementos disponibles
    const filteredItems = availableItems.filter(
        (item) =>
            item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
            item.dia === selectDay
    );

    // Manejar selección de elemento
    const handleItemSelect = (item: Path) => {
        onItemSelect(item)
        onOpenChange(false)
    }

    // Manejar Enter en búsqueda
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && filteredItems.length === 1) {
            handleItemSelect(filteredItems[0])
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Buscador */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            ref={searchInputRef}
                            placeholder="Buscar elemento..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="pl-10"
                        />
                    </div>

                    {/* Lista de elementos */}
                    <div className="max-h-80 overflow-y-auto space-y-2 border rounded-lg p-2">
                        {filteredItems.length > 0 ? (
                            filteredItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleItemSelect(item)}
                                    className="w-full text-left p-3 rounded-lg border bg-white hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                >
                                    <div className="font-medium text-gray-900">{item.nombre}</div>
                                </button>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                {searchTerm ? "No se encontraron elementos" : "No hay elementos disponibles"}
                            </div>
                        )}
                    </div>

                    {/* Información de ayuda */}
                    <div className="text-xs text-gray-400 text-center">
                        {filteredItems.length > 0 && (
                            <span>
                                {filteredItems.length === 1
                                    ? "Presiona Enter para seleccionar"
                                    : `${filteredItems.length} elementos encontrados`}
                            </span>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}