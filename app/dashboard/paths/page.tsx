"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Route, PowerSquare } from "lucide-react"
import { pathService } from "@/services/pathService"
import { parametrizationService } from "@/services/parametrizationService"
import type { Path, Parametrizacion } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { PathDialog } from "@/components/dialogs/PathDialog"
import type { ColumnDef } from "@tanstack/react-table"

const DIAS_SEMANA = {
    l: "Lunes",
    m: "Martes",
    x: "Miércoles",
    j: "Jueves",
    v: "Viernes",
    s: "Sábado",
    d: "Domingo",
}

const DIAS_COLORS = {
    l: "bg-blue-100 text-blue-800",
    m: "bg-green-100 text-green-800",
    x: "bg-yellow-100 text-yellow-800",
    j: "bg-purple-100 text-purple-800",
    v: "bg-pink-100 text-pink-800",
    s: "bg-indigo-100 text-indigo-800",
    d: "bg-red-100 text-red-800",
}

export default function RutasPage() {
    const [rutas, setRutas] = useState<Path[]>([])
    const [oficinas, setOficinas] = useState<Parametrizacion[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedRuta, setSelectedRuta] = useState<Path | null>(null)
    const { toast } = useToast()

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const [rutasData, oficinasData] = await Promise.all([
                pathService.getData(1, 100),
                parametrizationService.getListaActivos("oficina"),
                parametrizationService.getListaActivos("t_residuo"),
            ])
            setRutas(rutasData.data)
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
        setDialogOpen(true)
    }

    const handleEdit = (ruta: Path) => {
        setSelectedRuta(ruta)
        setDialogOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de que deseas eliminar esta ruta?")) {
            try {
                await pathService.delete(id)
                toast({
                    title: "Ruta eliminada",
                    description: "La ruta ha sido eliminada exitosamente",
                })
                loadData()
            } catch (error) {
                toast({
                    title: "Error",
                    description: "No se pudo eliminar la ruta",
                    variant: "destructive",
                })
            }
        }
    }

    const handleToggleStatus = async (id: string) => {
        if (confirm("¿Estás seguro de que deseas cambiar el estado a esta ruta?")) {
            try {
                await pathService.toggleRutaStatus(id)
                toast({
                    title: "Estado actualizado",
                    description: "El estado de la ruta ha sido actualizado",
                })
                loadData()
            } catch (error) {
                toast({
                    title: "Error",
                    description: "No se pudo actualizar el estado",
                    variant: "destructive",
                })
            }
        }
    }

    const columns: ColumnDef<Path>[] = [
        {
            accessorKey: "codigo",
            header: "Código",
            cell: ({ row }) => {
                return <span className="font-mono text-sm">{row.getValue("codigo")}</span>
            },
        },
        {
            accessorKey: "nombre",
            header: "Nombre",
        },
        {
            accessorKey: "dia",
            header: "Día",
            cell: ({ row }) => {
                const dia = row.getValue("dia") as keyof typeof DIAS_SEMANA
                return <Badge className={DIAS_COLORS[dia]}>{DIAS_SEMANA[dia]}</Badge>
            },
        },
        {
            accessorKey: "oficina",
            header: "Planta",
            cell: ({ row }) => {
                const oficina = oficinas.find((o) => o.id === row.original.oficinaId)
                return oficina?.nombre || "N/A"
            },
        },
        {
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
            id: "actions",
            header: "Acciones",
            cell: ({ row }) => {
                const ruta = row.original
                return (
                    <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(ruta)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(ruta.id)}
                            className={ruta.activo ? "text-green-600" : "text-red-600"}
                        >
                            <PowerSquare className="h-4 w-4" />
                        </Button>
                    </div>
                )
            },
        },
    ]

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
                <Button onClick={handleCreate} className="bg-primary hover:bg-primary-hover">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Ruta
                </Button>
            </div>

            {/* Tabla de Rutas */}
            <Card>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={rutas}
                        searchKey="nombre"
                        searchPlaceholder="Buscar por nombre..."
                    />
                </CardContent>
            </Card>

            <PathDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                ruta={selectedRuta}
                oficinas={oficinas}
                onSuccess={loadData}
            />
        </div>
    )
}