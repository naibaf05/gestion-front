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
import { Loader2, Upload, Trash2, RotateCcw, PenLine } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { userService } from "@/services/userService"

interface FirmaDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    displayName?: string
    userId: string
    currentFirma?: string | null
    onSuccess: () => void
}

export function FirmaDialog({
    open,
    onOpenChange,
    displayName,
    userId,
    currentFirma,
    onSuccess,
}: FirmaDialogProps) {
    const [newFirmaBase64, setNewFirmaBase64] = useState<string | null>(null)
    const [changingFirma, setChangingFirma] = useState(false)
    const [loading, setLoading] = useState(false)
    const [mode, setMode] = useState<"upload" | "draw">("upload")
    const [isDrawing, setIsDrawing] = useState(false)
    const [hasDrawn, setHasDrawn] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const { toast } = useToast()

    const hasFirma = !!currentFirma

    useEffect(() => {
        if (open) {
            setNewFirmaBase64(null)
            setChangingFirma(false)
            setMode("upload")
            setHasDrawn(false)
        }
    }, [open])

    // Inicializar canvas cuando se muestra el pad de dibujo
    useEffect(() => {
        const showPad = (!hasFirma || changingFirma) && mode === "draw"
        if (open && showPad) {
            setTimeout(() => initCanvas(), 50)
        }
    }, [open, mode, changingFirma, hasFirma])

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

    const canvasToBase64 = (): string | null => {
        const canvas = canvasRef.current
        if (!canvas) return null
        return canvas.toDataURL("image/png")
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith("image/")) {
            toast({
                title: "Archivo inválido",
                description: "Por favor selecciona un archivo de imagen (JPG, PNG, etc.)",
                variant: "destructive",
            })
            return
        }

        const maxSizeMB = 2
        if (file.size > maxSizeMB * 1024 * 1024) {
            toast({
                title: "Archivo muy grande",
                description: `La imagen no debe superar los ${maxSizeMB} MB`,
                variant: "destructive",
            })
            return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
            const base64 = event.target?.result as string
            setNewFirmaBase64(base64)
        }
        reader.readAsDataURL(file)
    }

    const handleSave = async () => {
        let base64: string | null = null
        if (mode === "draw") {
            if (!hasDrawn) return
            base64 = canvasToBase64()
        } else {
            base64 = newFirmaBase64
        }
        if (!base64) return
        try {
            setLoading(true)
            if (hasFirma) {
                await userService.updateFirma(userId, base64)
            } else {
                await userService.addFirma(userId, base64)
            }
            toast({
                title: "Firma guardada",
                description: `La firma de ${displayName ?? "el usuario"} ha sido ${hasFirma ? "actualizada" : "guardada"} exitosamente`,
                variant: "success",
            })
            handleClose()
            onSuccess()
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

    const handleClose = () => {
        setNewFirmaBase64(null)
        setChangingFirma(false)
        setMode("upload")
        setHasDrawn(false)
        if (fileInputRef.current) fileInputRef.current.value = ""
        onOpenChange(false)
    }

    const showEditor = !hasFirma || changingFirma

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Firma</DialogTitle>
                    {displayName && (
                        <p className="text-sm text-gray-600">
                            Usuario: <span className="font-medium">{displayName}</span>
                        </p>
                    )}
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Preview de firma actual */}
                    {hasFirma && !changingFirma && (
                        <div className="space-y-2">
                            <Label>Firma actual</Label>
                            <div className="border rounded-md p-3 bg-gray-50 flex items-center justify-center min-h-[120px]">
                                <img
                                    src={currentFirma!}
                                    alt="Firma actual"
                                    className="max-h-40 max-w-full object-contain"
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setChangingFirma(true)
                                    setNewFirmaBase64(null)
                                    setMode("upload")
                                    setHasDrawn(false)
                                    if (fileInputRef.current) fileInputRef.current.value = ""
                                }}
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                Cambiar firma
                            </Button>
                        </div>
                    )}

                    {/* Editor de firma (subir o dibujar) */}
                    {showEditor && (
                        <div className="space-y-3">
                            {/* Selector de modo */}
                            <div className="flex gap-2">
                                <Button
                                    variant={mode === "upload" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => {
                                        setMode("upload")
                                        setHasDrawn(false)
                                    }}
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    Subir imagen
                                </Button>
                                <Button
                                    variant={mode === "draw" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => {
                                        setMode("draw")
                                        setNewFirmaBase64(null)
                                        if (fileInputRef.current) fileInputRef.current.value = ""
                                    }}
                                >
                                    <PenLine className="mr-2 h-4 w-4" />
                                    Dibujar firma
                                </Button>
                            </div>

                            {/* Modo: subir imagen */}
                            {mode === "upload" && (
                                <div className="space-y-2">
                                    <div
                                        className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary transition-colors"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload className="h-8 w-8 text-gray-400" />
                                        <p className="text-sm text-gray-500 text-center">
                                            Haz clic para seleccionar una imagen<br />
                                            <span className="text-xs">JPG, PNG, GIF — máx. 2 MB</span>
                                        </p>
                                        <input
                                            ref={fileInputRef}
                                            id="firmaInput"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </div>

                                    {/* Preview de nueva imagen seleccionada */}
                                    {newFirmaBase64 && (
                                        <div className="space-y-2">
                                            <Label>Vista previa</Label>
                                            <div className="border rounded-md p-3 bg-gray-50 flex items-center justify-center min-h-[100px] relative">
                                                <img
                                                    src={newFirmaBase64}
                                                    alt="Vista previa de firma"
                                                    className="max-h-40 max-w-full object-contain"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setNewFirmaBase64(null)
                                                        if (fileInputRef.current) fileInputRef.current.value = ""
                                                    }}
                                                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                                    title="Quitar imagen"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Modo: dibujar firma */}
                            {mode === "draw" && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Dibuje su firma</Label>
                                        <Button variant="ghost" size="sm" onClick={initCanvas}>
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
                                </div>
                            )}

                            {hasFirma && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setChangingFirma(false)
                                        setNewFirmaBase64(null)
                                        setMode("upload")
                                        setHasDrawn(false)
                                        if (fileInputRef.current) fileInputRef.current.value = ""
                                    }}
                                >
                                    Cancelar cambio
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={handleClose} disabled={loading}>
                        Cerrar
                    </Button>
                    {showEditor && (
                        <Button
                            onClick={handleSave}
                            disabled={loading || (mode === "upload" ? !newFirmaBase64 : !hasDrawn)}
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
