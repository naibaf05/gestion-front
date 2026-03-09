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
import { Loader2, Upload, Trash2 } from "lucide-react"
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
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { toast } = useToast()

    const hasFirma = !!currentFirma

    useEffect(() => {
        if (open) {
            setNewFirmaBase64(null)
            setChangingFirma(false)
        }
    }, [open])

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
        if (!newFirmaBase64) return
        try {
            setLoading(true)
            if (hasFirma) {
                await userService.updateFirma(userId, newFirmaBase64)
            } else {
                await userService.addFirma(userId, newFirmaBase64)
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
        if (fileInputRef.current) fileInputRef.current.value = ""
        onOpenChange(false)
    }

    const showFileInput = !hasFirma || changingFirma

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
                                    if (fileInputRef.current) fileInputRef.current.value = ""
                                }}
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                Cambiar firma
                            </Button>
                        </div>
                    )}

                    {/* Input para seleccionar imagen */}
                    {showFileInput && (
                        <div className="space-y-2">
                            <Label htmlFor="firmaInput">
                                {hasFirma ? "Nueva firma" : "Seleccionar imagen de firma"}
                            </Label>
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

                            {hasFirma && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setChangingFirma(false)
                                        setNewFirmaBase64(null)
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
                    {showFileInput && (
                        <Button
                            onClick={handleSave}
                            disabled={loading || !newFirmaBase64}
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
