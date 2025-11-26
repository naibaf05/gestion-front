"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Route, PowerSquare, Eye } from "lucide-react"
import { pathService } from "@/services/pathService"
import { parametrizationService } from "@/services/parametrizationService"
import type { Path, Parametrizacion } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { PathDialog } from "@/components/dialogs/PathDialog"
import { useAuth } from "@/contexts/AuthContext"
import type { ColumnDef } from "@tanstack/react-table"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

export default function RutasPage() {
    const { user, logout } = useAuth();

    const [rutas, setRutas] = useState<Path[]>([])
    const [oficinas, setOficinas] = useState<Parametrizacion[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedRuta, setSelectedRuta] = useState<Path | null>(null)
    const [dialogReadOnly, setDialogReadOnly] = useState(false)
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
    const [rutaToToggle, setRutaToToggle] = useState<string | null>(null)
    const { toast } = useToast()

    if (user && user.permisos && typeof user.permisos === "string") {
        user.permisos = JSON.parse(user.permisos);
    }

    const hasPermission = (permission: string): boolean => {
        if (!user || !user.permisos) return false
        if (user.perfil?.nombre === "ADMIN") return true
        return user.permisos[permission] === true
    }

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const [rutasData, oficinasData] = await Promise.all([
                pathService.getData(),
                parametrizationService.getListaActivos("oficina"),
                parametrizationService.getListaActivos("t_residuo"),
            ])
            setRutas(rutasData)
            setOficinas(oficinasData)
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudieron cargar los datos",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = () => {
        setSelectedRuta(null)
        setDialogReadOnly(false)
        setDialogOpen(true)
    }

    const handleEdit = (ruta: Path) => {
        setSelectedRuta(ruta)
        setDialogReadOnly(false)
        setDialogOpen(true)
    }

    const handleView = (ruta: Path) => {
        setSelectedRuta(ruta)
        setDialogReadOnly(true)
        setDialogOpen(true)
    }

    const handleToggleStatus = (id: string) => {
        setRutaToToggle(id)
        setConfirmDialogOpen(true)
    }

    const confirmToggleStatus = async () => {
        if (!rutaToToggle) return
        try {
            await pathService.toggleRutaStatus(rutaToToggle)
            toast({
                title: "Estado actualizado",
                description: "El estado de la ruta ha sido actualizado",
                variant: "success",
            })
            loadData()
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo actualizar el estado",
                variant: "destructive",
            })
        } finally {
            setRutaToToggle(null)
            setConfirmDialogOpen(false)
        }
    }

    const cancelToggleStatus = () => {
        setRutaToToggle(null)
        setConfirmDialogOpen(false)
    }

    const columns: ColumnDef<Path>[] = [
        {
            width: "100px",
            accessorKey: "codigo",
            header: "Código",
        },
        {
            width: "200px",
            accessorKey: "nombre",
            header: "Nombre",
        },
        {
            width: "100px",
            accessorKey: "diaNombre",
            header: "Día",
            cell: ({ row }) => {
                return (
                    <Badge className={row.original.diaColor}>
                        {row.original.diaNombre}
                    </Badge>
                );
            },
        },
        {
            width: "350px",
            accessorKey: "oficina",
            header: "Planta",
            cell: ({ row }) => {
                const oficina = oficinas.find((o) => o.id === row.original.oficinaId)
                return oficina?.nombre || "N/A"
            },
        },
        {
            width: "100px",
            accessorKey: "activo",
            header: "Estado",
            cell: ({ row }) => {
                return (
                    <Badge variant={row.getValue("activo") ? "default" : "secondary"}>
                        {row.getValue("activo") ? "Activo" : "Inactivo"}
                    </Badge>
                )
            },
        },
        {
            width: "150px",
            id: "actions",
            header: "Acciones",
            cell: ({ row }) => {
                const ruta = row.original
                return (
                    <div className="flex items-center space-x-2">
                        {hasPermission("routes.edit") ? (
                            <>
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(ruta)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleToggleStatus(ruta.id)}
                                    className={ruta.activo ? "new-text-green-600" : "new-text-red-600"}
                                >
                                    <PowerSquare className="h-4 w-4" />
                                </Button>
                            </>
                        ) : (
                            <Button variant="ghost" size="sm" onClick={() => handleView(ruta)}>
                                <Eye className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                )
            },
        },
    ]

    if (!hasPermission("routes.view")) {
        return <div className="p-8 text-center text-muted-foreground">No tienes permiso para ver rutas.</div>
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Cargando rutas...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Route className="h-8 w-8" />
                        Rutas
                    </h1>
                    <p className="text-gray-600">Gestiona las rutas de recolección</p>
                </div>
                {hasPermission("routes.edit") && (
                    <Button onClick={handleCreate} className="bg-primary hover:bg-primary-hover">
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Ruta
                    </Button>
                )}
            </div>

            {/* Tabla de Rutas */}
            <Card>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={rutas}
                        searchKey={["codigo", "nombre", "diaNombre"]}
                        searchPlaceholder="Buscar ..."
                    />
                </CardContent>
            </Card>

            <PathDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                ruta={selectedRuta}
                oficinas={oficinas}
                onSuccess={loadData}
                readOnly={dialogReadOnly}
            />

            <ConfirmationDialog
                open={confirmDialogOpen}
                onOpenChange={setConfirmDialogOpen}
                title="Cambiar estado de la ruta"
                description="¿Estás seguro de que deseas cambiar el estado de esta ruta?"
                confirmText="Cambiar Estado"
                cancelText="Cancelar"
                onConfirm={confirmToggleStatus}
                onCancel={cancelToggleStatus}
                variant="default"
            />
        </div>
    )
}