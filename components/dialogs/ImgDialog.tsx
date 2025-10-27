"use client"

import type React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ImgDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title?: string
    base64: string
}

export function ImgDialog({
    open,
    onOpenChange,
    title = "Visualización de Imagen",
    base64,
}: ImgDialogProps) {
    const imgData = `data:image/png;base64,${base64}`;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-auto flex items-center justify-center p-4">
                        <img
                            src={imgData}
                            alt="Imagen"
                            className="max-w-full max-h-full object-contain"
                            style={{ maxHeight: "600px" }}
                        />
                    </div>

                    {/* Botón de cerrar */}
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cerrar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}