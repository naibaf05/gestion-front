"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
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
import { Loader2, RotateCcw } from "lucide-react"

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

    // Firma state
    const [isDrawing, setIsDrawing] = useState(false)
    const [hasDrawn, setHasDrawn] = useState(false)
    const canvasRef = useRef<HTMLCanvasElement>(null)

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
            setHasDrawn(false)
        }
    }, [open])

    // Inicializar canvas cuando se muestra el pad de dibujo
    useEffect(() => {
        if (open) {
            setTimeout(() => initCanvas(), 50)
        }
    }, [open])

    const initCanvas = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        const lineY = Math.round(canvas.height * 0.7)
        ctx.save()
        ctx.strokeStyle = "#000000"
        ctx.lineWidth = 2
        ctx.setLineDash([])
        ctx.beginPath()
        ctx.moveTo(20, lineY)
        ctx.lineTo(canvas.width - 20, lineY)
        ctx.stroke()
        ctx.restore()
        ctx.strokeStyle = "#000000"
        ctx.lineWidth = 2
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        setHasDrawn(false)
    }

    const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height
        if ("touches" in e) {
            const touch = (e as React.TouchEvent).touches[0]
            return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY }
        }
        const me = e as React.MouseEvent
        return { x: (me.clientX - rect.left) * scaleX, y: (me.clientY - rect.top) * scaleY }
    }

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault()
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        const pos = getPos(e, canvas)
        ctx.beginPath()
        ctx.moveTo(pos.x, pos.y)
        setIsDrawing(true)
        setHasDrawn(true)
    }

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault()
        if (!isDrawing) return
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        const pos = getPos(e, canvas)
        ctx.lineTo(pos.x, pos.y)
        ctx.stroke()
    }

    const stopDrawing = () => setIsDrawing(false)

    const getFirmaValue = (): string | null => {
        if (!hasDrawn || !canvasRef.current) return null
        return canvasRef.current.toDataURL("image/png")
    }

    const firmaValida = hasDrawn

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const firma = getFirmaValue()
        if (!firma) {
            toast({
                title: "Firma requerida",
                description: "Por favor dibuje la firma del conductor",
                variant: "destructive",
            })
            return
        }

        setLoading(true)

        try {
            await vehicleService.guardarManual({ ...formData, firma })

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

                        {/* Firma del conductor */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label required>Firma del conductor</Label>
                                <Button type="button" variant="ghost" size="sm" onClick={initCanvas}>
                                    <RotateCcw className="mr-1 h-4 w-4" />
                                    Limpiar
                                </Button>
                            </div>
                            <div className="border-2 border-dashed border-gray-300 rounded-md bg-white touch-none select-none">
                                <canvas
                                    ref={canvasRef}
                                    width={460}
                                    height={180}
                                    className="w-full h-[180px] cursor-crosshair"
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    onTouchStart={startDrawing}
                                    onTouchMove={draw}
                                    onTouchEnd={stopDrawing}
                                />
                            </div>
                            {!hasDrawn && (
                                <p className="text-xs text-red-500">La firma es obligatoria</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading || !firmaValida}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
