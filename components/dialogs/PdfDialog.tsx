"use client"

import type React from "react"
import { useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface PdfDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title?: string
    base64: string
}

export function PdfDialog({
    open,
    onOpenChange,
    title = "Visualización PDF",
    base64,
}: PdfDialogProps) {
    const pdfData = `data:application/pdf;base64,${base64}`;

    useEffect(() => {
    }, [])

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                    </DialogHeader>

                    <iframe
                        src={pdfData}
                        width="100%"
                        height="600px"
                        style={{ border: "none" }}
                        title="PDF Viewer"
                    />

                    {/* Botones de acción */}
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