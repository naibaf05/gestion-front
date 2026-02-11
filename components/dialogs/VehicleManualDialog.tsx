"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { vehicleService } from "@/services/vehicleService"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface VehicleManualDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function VehicleManualDialog({
    open,
    onOpenChange,
    onSuccess,
}: VehicleManualDialogProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        nombre: "",
        apellido: "",
        documento: "",
        telefono: "",
        placa: "",
    })
    const { toast } = useToast()

    useEffect(() => {
        if (!open) {
            // Limpiar el formulario cuando se cierre el diálogo
            setFormData({
                nombre: "",
                apellido: "",
                documento: "",
                telefono: "",
                placa: "",
            })
        }
    }, [open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            await vehicleService.guardarManual(formData)

            toast({
                title: "Vehículo registrado",
                description: "El vehículo ha sido registrado exitosamente",
            })

            // Actualizar el listado de vehículos
            await vehicleService.getVehiclesActivos()

            onSuccess()
            onOpenChange(false)
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo registrar el vehículo",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Crear Vehículo Manual</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nombre" required>Nombre</Label>
                                <Input
                                    id="nombre"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    required
                                    placeholder="Ingrese el nombre"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="apellido" required>Apellido</Label>
                                <Input
                                    id="apellido"
                                    value={formData.apellido}
                                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                                    required
                                    placeholder="Ingrese el apellido"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="documento" required>Documento</Label>
                                <Input
                                    id="documento"
                                    value={formData.documento}
                                    onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                                    required
                                    placeholder="Ingrese el documento"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="telefono" required>Teléfono</Label>
                                <Input
                                    id="telefono"
                                    value={formData.telefono}
                                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                    required
                                    placeholder="Ingrese el teléfono"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="placa" required>Placa</Label>
                                <Input
                                    id="placa"
                                    value={formData.placa}
                                    onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                                    required
                                    placeholder="Ingrese la placa"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
