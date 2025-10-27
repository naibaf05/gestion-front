"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Upload, Eye, Trash2, Loader2, Download } from "lucide-react"
import { adjuntosService } from "@/services/adjuntosService"
import type { Adjunto } from "@/types"
import { useToast } from "@/hooks/use-toast"
import type { ColumnDef } from "@tanstack/react-table"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { ButtonTooltip } from "@/components/ui/button-tooltip"
import { TooltipProvider } from "@radix-ui/react-tooltip"
import { PdfDialog } from "./PdfDialog"
import { ImgDialog } from "./ImgDialog"

interface AdjuntosDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    tipo: string
    entityId: string
    title?: string
}

export function AdjuntosDialog({
    open,
    onOpenChange,
    tipo,
    entityId,
    title = "Adjuntos"
}: AdjuntosDialogProps) {
    const [adjuntos, setAdjuntos] = useState<Adjunto[]>([])
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
    const [selectedAdjunto, setSelectedAdjunto] = useState<Adjunto | null>(null)
    
    // Estados para los diálogos de visualización
    const [pdfDialogOpen, setPdfDialogOpen] = useState(false)
    const [imgDialogOpen, setImgDialogOpen] = useState(false)
    const [viewData, setViewData] = useState({ base64: "", titulo: "" })
    
    const { toast } = useToast()

    useEffect(() => {
        if (open && tipo && entityId) {
            loadAdjuntos()
        }
    }, [open, tipo, entityId])

    const loadAdjuntos = async () => {
        try {
            setLoading(true)
            const data = await adjuntosService.getAdjuntos(tipo, entityId)
            setAdjuntos(data)
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudieron cargar los adjuntos",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleUpload = () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.multiple = true
        input.onchange = async (e) => {
            const files = (e.target as HTMLInputElement).files
            if (files && files.length > 0) {
                setUploading(true)
                try {
                    for (let i = 0; i < files.length; i++) {
                        await adjuntosService.uploadAdjunto(files[i], tipo, entityId)
                    }
                    toast({
                        title: "Archivos subidos",
                        description: `Se subieron ${files.length} archivo(s) correctamente`,
                    })
                    loadAdjuntos()
                } catch (error: any) {
                    toast({
                        title: "Error",
                        description: error?.message || "No se pudieron subir los archivos",
                        variant: "destructive",
                    })
                } finally {
                    setUploading(false)
                }
            }
        }
        input.click()
    }

    const downloadFromBase64 = (base64: string, fileName: string, mimeType?: string) => {
        try {
            // Determinar el tipo MIME si no se proporciona
            let finalMimeType = mimeType || 'application/octet-stream';
            
            // Convertir base64 a blob
            const byteCharacters = atob(base64);
            const byteNumbers = new Array(byteCharacters.length);
            
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: finalMimeType });
            
            // Crear URL del blob y descargar
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            toast({
                title: "Descarga iniciada",
                description: `Descargando ${fileName}`,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo descargar el archivo",
                variant: "destructive",
            });
        }
    }

    const handleView = async (adjunto: Adjunto) => {
        try {
            const adj = await adjuntosService.getView(adjunto.id);
            const { tipoArchivo, base64 } = adj;
            
            if (!base64) {
                toast({
                    title: "Error",
                    description: "No se pudo cargar el contenido del archivo",
                    variant: "destructive",
                });
                return;
            }

            setViewData({
                base64: base64,
                titulo: `${adjunto.nombre}`
            });

            // Determinar el tipo de archivo y abrir el diálogo correspondiente
            if (tipoArchivo?.toLowerCase() === 'pdf') {
                setPdfDialogOpen(true);
            } else if (tipoArchivo?.toLowerCase() === 'img' || 
                       tipoArchivo?.toLowerCase() === 'png' || 
                       tipoArchivo?.toLowerCase() === 'jpg' || 
                       tipoArchivo?.toLowerCase() === 'jpeg') {
                setImgDialogOpen(true);
            } else {
                // Para otros tipos de archivo, descargar desde base64
                downloadFromBase64(base64, adjunto.nombre, tipoArchivo);
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.message || "No se pudo cargar el archivo",
                variant: "destructive",
            });
        }
    }

    const handleDownload = async (adjunto: Adjunto) => {
        try {
            const adj = await adjuntosService.getView(adjunto.id);
            const { base64, tipoArchivo } = adj;
            
            if (!base64) {
                toast({
                    title: "Error",
                    description: "No se pudo cargar el contenido del archivo",
                    variant: "destructive",
                });
                return;
            }

            downloadFromBase64(base64, adjunto.nombre, tipoArchivo);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.message || "No se pudo descargar el archivo",
                variant: "destructive",
            });
        }
    }

    const handleDelete = (adjunto: Adjunto) => {
        setSelectedAdjunto(adjunto)
        setConfirmDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (!selectedAdjunto) return

        try {
            await adjuntosService.deleteAdjunto(selectedAdjunto.id)
            toast({
                title: "Adjunto eliminado",
                description: "El adjunto ha sido eliminado exitosamente",
            })
            loadAdjuntos()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.message || "No se pudo eliminar el adjunto",
                variant: "destructive",
            })
        } finally {
            setSelectedAdjunto(null)
        }
    }

    const cancelDelete = () => {
        setSelectedAdjunto(null)
    }

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return "N/A"
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(1024))
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
    }

    const columns: ColumnDef<Adjunto>[] = [
        {
            accessorKey: "nombre",
            header: "Nombre"
        },
        {
            id: "actions",
            header: "Acciones",
            cell: ({ row }) => {
                const adjunto = row.original
                return (
                    <TooltipProvider>
                        <div className="flex items-center space-x-2">
                            <ButtonTooltip
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(adjunto)}
                                className="text-blue-600"
                                tooltipContent="Visualizar"
                            >
                                <Eye className="h-4 w-4" />
                            </ButtonTooltip>
                            <ButtonTooltip
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(adjunto)}
                                className="text-green-600"
                                tooltipContent="Descargar"
                            >
                                <Download className="h-4 w-4" />
                            </ButtonTooltip>
                            <ButtonTooltip
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(adjunto)}
                                className="text-red-600"
                                tooltipContent="Eliminar"
                            >
                                <Trash2 className="h-4 w-4" />
                            </ButtonTooltip>
                        </div>
                    </TooltipProvider>
                )
            },
        },
    ]

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden flex flex-col space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                                Total: {adjuntos.length} adjunto(s)
                            </div>
                            <Button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="bg-primary hover:bg-primary-hover"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Subiendo...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Subir Archivos
                                    </>
                                )}
                            </Button>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            {loading ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                        <p className="mt-2 text-sm text-gray-600">Cargando adjuntos...</p>
                                    </div>
                                </div>
                            ) : (
                                <DataTable
                                    columns={columns}
                                    data={adjuntos}
                                    searchKey={["nombreOriginal", "nombre"]}
                                    searchPlaceholder="Buscar archivos..."
                                />
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmationDialog
                open={confirmDialogOpen}
                onOpenChange={setConfirmDialogOpen}
                title="Eliminar Adjunto"
                description={`¿Estás seguro de que deseas eliminar el archivo "${selectedAdjunto?.nombre}"?`}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />

            {/* Diálogos de visualización */}
            <PdfDialog
                open={pdfDialogOpen}
                onOpenChange={setPdfDialogOpen}
                title={viewData.titulo}
                base64={viewData.base64}
            />

            <ImgDialog
                open={imgDialogOpen}
                onOpenChange={setImgDialogOpen}
                title={viewData.titulo}
                base64={viewData.base64}
            />
        </>
    )
}