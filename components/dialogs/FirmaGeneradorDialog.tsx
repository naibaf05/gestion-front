"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Loader2, Trash2, RotateCcw, PenLine } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { adjuntosService } from "@/services/adjuntosService"
import { visitService } from "@/services/visitService"

interface FirmaGeneradorDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    visitaId: string
    onSuccess?: () => void
}

export function FirmaGeneradorDialog({
    open,
    onOpenChange,
    visitaId,
    onSuccess,
}: FirmaGeneradorDialogProps) {
    const [loading, setLoading] = useState(false)

    const [loadingCurrent, setLoadingCurrent] = useState(false)
    const [currentAdjunto, setCurrentAdjunto] = useState<{ id: string; base64: string } | null>(null)
    const [changingFirma, setChangingFirma] = useState(false)
    const [nombreFirmante, setNombreFirmante] = useState("")
    const savedNombreFirmante = useRef("")
    const [isDrawing, setIsDrawing] = useState(false)
    const [hasDrawn, setHasDrawn] = useState(false)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const { toast } = useToast()

    useEffect(() => {
        if (open && visitaId) {
            loadCurrentFirma()
        } else {
            setCurrentAdjunto(null)
            setChangingFirma(false)
            setHasDrawn(false)
            setNombreFirmante("")
        }
    }, [open, visitaId])

    // Inicializar canvas cuando se muestra el pad
    useEffect(() => {
        if ((open && !currentAdjunto && !loadingCurrent) || changingFirma) {
            setTimeout(() => initCanvas(), 50)
        }
    }, [open, currentAdjunto, loadingCurrent, changingFirma])

    const initCanvas = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Línea de referencia horizontal
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

    const handleClearCanvas = () => initCanvas()

    const canvasToFile = (): File | null => {
        const canvas = canvasRef.current
        if (!canvas) return null
        const dataUrl = canvas.toDataURL("image/png")
        const byteString = atob(dataUrl.split(",")[1])
        const ab = new ArrayBuffer(byteString.length)
        const ia = new Uint8Array(ab)
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i)
        return new File([ab], `firma_generador_${visitaId}.png`, { type: "image/png" })
    }

    const loadCurrentFirma = async () => {
        try {
            setLoadingCurrent(true)
            const [adjuntos, visita] = await Promise.all([
                adjuntosService.getAdjuntosFtp("firma-generador", visitaId),
                visitService.getId(visitaId)
            ])
            const firmaName = visita.firma || ""
            setNombreFirmante(firmaName)
            savedNombreFirmante.current = firmaName
            if (adjuntos && adjuntos.length > 0) {
                const adj = await adjuntosService.getView(adjuntos[0].id)
                if (adj.base64) {
                    setCurrentAdjunto({ id: adjuntos[0].id, base64: "data:image/" + adj.tipoArchivo + ";base64," + adj.base64 })
                }
            }
        } catch {
            // No hay firma aún
        } finally {
            setLoadingCurrent(false)
        }
    }

    const handleSave = async () => {
        const file = canvasToFile()
        if (!file || !hasDrawn) return
        try {
            setLoading(true)
            if (currentAdjunto) {
                await adjuntosService.deleteAdjunto(currentAdjunto.id)
            }
            await adjuntosService.uploadAdjunto(file, "firma-generador", visitaId)
            await visitService.updateFirma(visitaId, nombreFirmante.trim())
            toast({
                title: "Firma guardada",
                description: "La firma del generador ha sido guardada exitosamente",
                variant: "success",
            })
            handleClose()
            onSuccess?.()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.message || "No se pudo guardar la firma",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!currentAdjunto) return
        try {
            setLoading(true)
            await adjuntosService.deleteAdjunto(currentAdjunto.id)
            setCurrentAdjunto(null)
            toast({
                title: "Firma eliminada",
                description: "La firma del generador ha sido eliminada",
                variant: "success",
            })
            onSuccess?.()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.message || "No se pudo eliminar la firma",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setChangingFirma(false)
        setHasDrawn(false)
        setNombreFirmante("")
        onOpenChange(false)
    }

    const hasFirma = !!currentAdjunto
    const showPad = !hasFirma || changingFirma

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Firma Generador</DialogTitle>
                    <p className="text-sm text-gray-500">Firma de recepción del generador para el certificado de visita</p>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {loadingCurrent ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                    ) : (
                        <>
                            {/* Preview de firma actual */}
                            {hasFirma && !changingFirma && (
                                <div className="space-y-2">
                                    <Label>Firma actual</Label>
                                    {nombreFirmante && (
                                        <p className="text-sm font-medium text-gray-700">{nombreFirmante}</p>
                                    )}
                                    <div className="border rounded-md p-3 bg-gray-50 flex items-center justify-center min-h-[120px]">
                                        <img
                                            src={currentAdjunto!.base64}
                                            alt="Firma generador"
                                            className="max-h-40 max-w-full object-contain"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setChangingFirma(true)}
                                        >
                                            <PenLine className="mr-2 h-4 w-4" />
                                            Cambiar firma
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700"
                                            onClick={handleDelete}
                                            disabled={loading}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Eliminar
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Pad de firma */}
                            {showPad && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>{hasFirma ? "Nueva firma" : "Dibuje su firma"}</Label>
                                        <Button variant="ghost" size="sm" onClick={handleClearCanvas}>
                                            <RotateCcw className="mr-1 h-4 w-4" />
                                            Limpiar
                                        </Button>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="nombreFirmante">Nombre de quien firma</Label>
                                        <input
                                            id="nombreFirmante"
                                            type="text"
                                            maxLength={200}
                                            value={nombreFirmante}
                                            onChange={e => setNombreFirmante(e.target.value)}
                                            placeholder="Nombre completo del firmante"
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        />
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
                                    {changingFirma && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setChangingFirma(false)
                                                setHasDrawn(false)
                                                setNombreFirmante(savedNombreFirmante.current)
                                            }}
                                        >
                                            Cancelar cambio
                                        </Button>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={loading}>
                        Cerrar
                    </Button>
                    {showPad && (
                        <Button
                            onClick={handleSave}
                            disabled={loading || !hasDrawn}
                            className="bg-primary hover:bg-primary-hover"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                "Guardar firma"
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
