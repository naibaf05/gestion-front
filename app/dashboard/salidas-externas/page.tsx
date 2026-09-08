"use client"

import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { DatePicker } from "@/components/ui/date-picker"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { ButtonTooltip } from "@/components/ui/button-tooltip"
import { Edit, Eye, FileText, History, Paperclip, PenLine, Plus, TableProperties, Trash2 } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import type { Parametrizacion, SalidaExterna, Sede, User, Vehicle } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { clientService } from "@/services/clientService"
import { parametrizationService } from "@/services/parametrizationService"
import { salidaExternaService } from "@/services/salidaExternaService"
import { userService } from "@/services/userService"
import { vehicleService } from "@/services/vehicleService"
import { filterPlantasByUser } from "@/utils/utils"
import { SalidaExternaDialog } from "@/components/dialogs/SalidaExternaDialog"
import { SalidaExternaCantidadesDialog } from "@/components/dialogs/SalidaExternaCantidadesDialog"
import { HistorialDialog } from "@/components/dialogs/HistorialDialog"
import { rateParamService } from "@/services/rateParamService"
import { certificatesService } from "@/services/certificatesService"
import { AdjuntosDialog } from "@/components/dialogs/AdjuntosDialog"
import { FirmaGeneradorDialog } from "@/components/dialogs/FirmaGeneradorDialog"
import { PdfDialog } from "@/components/dialogs/PdfDialog"

export default function SalidasExternasPage() {
    const { user } = useAuth()
    const { toast } = useToast()

    const [selectedDate, setSelectedDate] = useState(() => new Date())
    const [fechaFin, setFechaFin] = useState(() => new Date())
    const [dateString, setDateString] = useState(() => {
        const today = new Date()
        const formatter = new Intl.DateTimeFormat("en-CA", {
            timeZone: "America/Bogota",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        })
        return formatter.format(today)
    })
    const [fechaFinString, setFechaFinString] = useState(() => {
        const today = new Date()
        const formatter = new Intl.DateTimeFormat("en-CA", {
            timeZone: "America/Bogota",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        })
        return formatter.format(today)
    })

    const loadingTimeoutRef = useRef<NodeJS.Timeout>()

    const [salidasExternas, setSalidasExternas] = useState<SalidaExterna[]>([])
    const [sedes, setSedes] = useState<Sede[]>([])
    const [plantas, setPlantas] = useState<Parametrizacion[]>([])
    const [vehiculos, setVehiculos] = useState<Vehicle[]>([])
    const [conductores, setConductores] = useState<User[]>([])
    const [receptores, setReceptores] = useState<User[]>([])
    const [comerciales, setComerciales] = useState<Parametrizacion[]>([])
    const [fletes, setFletes] = useState<Parametrizacion[]>([])
    const [fletesGestion, setFletesGestion] = useState<Parametrizacion[]>([])
    const [fletesFocus, setFletesFocus] = useState<Parametrizacion[]>([])
    const [gestores, setGestores] = useState<Parametrizacion[]>([])

    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [dialogReadOnly, setDialogReadOnly] = useState(false)
    const [selectedSalidaExterna, setSelectedSalidaExterna] = useState<SalidaExterna | null>(null)
    const [cantidadesDialogOpen, setCantidadesDialogOpen] = useState(false)

    const [historialOpen, setHistorialOpen] = useState(false)
    const [historialId, setHistorialId] = useState("")
    const [historialLabel, setHistorialLabel] = useState("")
    const [adjuntosOpen, setAdjuntosOpen] = useState(false)
    const [firmaOpen, setFirmaOpen] = useState(false)
    const [pdfOpen, setPdfOpen] = useState(false)
    const [pdfBase64, setPdfBase64] = useState<string | null>(null)
    const [actionId, setActionId] = useState("")

    if (user && user.permisos && typeof user.permisos === "string") {
        user.permisos = JSON.parse(user.permisos)
    }

    const hasPermission = (permission: string): boolean => {
        if (!user || !user.permisos) return false
        if (user.perfil?.nombre === "ADMIN") return true
        return user.permisos[permission] === true
    }

    useEffect(() => {
        if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current)
        }

        loadingTimeoutRef.current = setTimeout(() => {
            loadData()
        }, 100)

        return () => {
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current)
            }
        }
    }, [dateString, fechaFinString])

    const handleDateChange = (newDate: Date | undefined) => {
        if (newDate && !isNaN(newDate.getTime())) {
            if (fechaFin && newDate > fechaFin) {
                toast({
                    title: "Fecha invalida",
                    description: "La fecha inicio no puede ser mayor que la fecha fin",
                    variant: "destructive",
                })
                return
            }
            setSelectedDate(newDate)
            const formatter = new Intl.DateTimeFormat("en-CA", {
                timeZone: "America/Bogota",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            })
            setDateString(formatter.format(newDate))
        }
    }

    const handleFechaFinChange = (newDate: Date | undefined) => {
        if (newDate && !isNaN(newDate.getTime())) {
            if (selectedDate && newDate < selectedDate) {
                toast({
                    title: "Fecha invalida",
                    description: "La fecha fin no puede ser menor que la fecha inicio",
                    variant: "destructive",
                })
                return
            }
            setFechaFin(newDate)
            const formatter = new Intl.DateTimeFormat("en-CA", {
                timeZone: "America/Bogota",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            })
            setFechaFinString(formatter.format(newDate))
        }
    }

    const loadData = async () => {
        try {
            setLoading(true)
            const [
                salidasData,
                sedesData,
                vehiculosData,
                conductoresData,
                receptoresData,
                plantasData,
                comercialesData,
                fletesGestionData,
                fletesFocusData,
                gestoresData,
            ] = await Promise.all([
                salidaExternaService.getSalidasExternas(dateString, fechaFinString),
                clientService.getSedesActivas(),
                vehicleService.getVehiclesActivos(),
                userService.getUsersActivos(),
                userService.getUsersActivos(),
                parametrizationService.getListaActivos("oficina"),
                parametrizationService.getListaActivos("comercial"),
                parametrizationService.getListaActivos("flete"),
                parametrizationService.getListaActivos("flete_focus"),
                parametrizationService.getListaActivos("gestor"),
            ])

            const withFormatted = salidasData.map((s) => ({
                ...s,
                numFormateado: s.num != null ? `SEXT${String(s.num).padStart(5, "0")}` : "",
            }))

            if (!user?.plantasIds || user.plantasIds.length === 0) {
                setSalidasExternas(withFormatted)
            } else {
                const allowed = new Set(user.plantasIds.map(String))
                setSalidasExternas(withFormatted.filter((s) =>
                    (s.plantaId && allowed.has(String(s.plantaId))) ||
                    (s.plantaDestinoId && allowed.has(String(s.plantaDestinoId)))
                ))
            }

            setSedes(sedesData)
            setVehiculos(vehiculosData)
            setConductores(conductoresData)
            setReceptores(receptoresData)
            setPlantas(filterPlantasByUser(plantasData, user))
            setComerciales(comercialesData)
            const sedeIds = sedesData.map((sede) => sede.id)
            const tarifasFlete = await rateParamService.getTableBySedes(sedeIds)
            const fleteIds = new Set(tarifasFlete.map((tarifa) => String(tarifa.parametrizacionId)))
            setFletes([...fletesGestionData, ...fletesFocusData].filter((flete) => fleteIds.has(String(flete.id))))
            setFletesGestion(fletesGestionData.filter((flete) => fleteIds.has(String(flete.id))))
            setFletesFocus(fletesFocusData.filter((flete) => fleteIds.has(String(flete.id))))
            setGestores(gestoresData)
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
        if (!hasPermission("salidaexterna.edit")) return
        setSelectedSalidaExterna(null)
        setDialogReadOnly(false)
        setDialogOpen(true)
    }

    const handleEdit = (obj: SalidaExterna) => {
        if (!hasPermission("salidaexterna.edit")) return
        setSelectedSalidaExterna(obj)
        setDialogReadOnly(false)
        setDialogOpen(true)
    }

    const handleView = (obj: SalidaExterna) => {
        setSelectedSalidaExterna(obj)
        setDialogReadOnly(true)
        setDialogOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!hasPermission("salidaexterna.edit")) return
        if (confirm("¿Estas seguro de que deseas eliminar esta salida externa? Solo se puede eliminar si no tiene productos asociados.")) {
            try {
                await salidaExternaService.deleteSalidaExterna(id)
                toast({ title: "Salida externa eliminada", description: "La salida externa fue eliminada correctamente", variant: "success" })
                loadData()
            } catch (error: any) {
                toast({
                    title: "Error",
                    description: error?.message || "No se pudo eliminar la salida externa",
                    variant: "destructive",
                })
            }
        }
    }

    const handleHistorial = (id: string, num?: number) => {
        setHistorialId(id)
        setHistorialLabel(`Salida Externa [${num != null ? `SEXT${String(num).padStart(5, "0")}` : id}]`)
        setHistorialOpen(true)
    }

    const handleCantidades = (obj: SalidaExterna) => {
        setSelectedSalidaExterna(obj)
        setCantidadesDialogOpen(true)
    }

    const handleExternalPdf = async (obj: SalidaExterna) => {
        if (!obj.id) return
        const base64 = await certificatesService.getCertificadoExternaPDF(obj.id, String(obj.num || "0"), obj.fecha, obj.notas || "")
        setPdfBase64(base64)
        setPdfOpen(true)
    }

    const columns: ColumnDef<SalidaExterna>[] = [
        { accessorKey: "numFormateado", header: "Numero" },
        { accessorKey: "fecha", header: "Fecha" },
        { accessorKey: "tipo", header: "Tipo" },
        { accessorKey: "salida", header: "Salida" },
        { accessorKey: "destino", header: "Destino" },
        { accessorKey: "conductorNombre", header: "Conductor" },
        { accessorKey: "gestorNombre", header: "Gestor" },
        {
            accessorKey: "activo",
            header: "Estado",
            cell: ({ row }) => (
                <Badge variant={row.getValue("activo") ? "default" : "secondary"}>
                    {row.getValue("activo") ? "Activo" : "Inactivo"}
                </Badge>
            ),
        },
        {
            id: "actions",
            header: "Acciones",
            cell: ({ row }) => {
                const obj = row.original
                return (
                    <TooltipProvider>
                        <div className="flex items-center space-x-2">
                            {hasPermission("salidaexterna.edit") ? (
                                <ButtonTooltip variant="ghost" size="sm" onClick={() => handleEdit(obj)} tooltipContent="Editar">
                                    <Edit className="h-4 w-4" />
                                </ButtonTooltip>
                            ) : (
                                <ButtonTooltip variant="ghost" size="sm" onClick={() => handleView(obj)} tooltipContent="Ver">
                                    <Eye className="h-4 w-4" />
                                </ButtonTooltip>
                            )}
                            <ButtonTooltip variant="ghost" size="sm" onClick={() => handleCantidades(obj)} tooltipContent="Productos">
                                <TableProperties className="h-4 w-4" />
                            </ButtonTooltip>

                            <DropdownMenu>
                                <Tooltip>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                            <span className="sr-only">Mas acciones</span>
                                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                                                <circle cx="5" cy="12" r="2" fill="currentColor" />
                                                <circle cx="12" cy="12" r="2" fill="currentColor" />
                                                <circle cx="19" cy="12" r="2" fill="currentColor" />
                                            </svg>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <TooltipContent>Mas acciones</TooltipContent>
                                </Tooltip>
                                <DropdownMenuContent align="end">
                                    {hasPermission("generar.pdf") && <DropdownMenuItem onClick={() => handleExternalPdf(obj)}><FileText className="h-4 w-4" /> PDF</DropdownMenuItem>}
                                    {hasPermission("salidaexterna.edit") && <DropdownMenuItem onClick={() => { setActionId(obj.id); setAdjuntosOpen(true) }}><Paperclip className="h-4 w-4" /> Adjuntos</DropdownMenuItem>}
                                    {hasPermission("salidaexterna.edit") && <DropdownMenuItem onClick={() => { setActionId(obj.id); setFirmaOpen(true) }}><PenLine className="h-4 w-4" /> Firma Generador</DropdownMenuItem>}
                                    {hasPermission("salidaexterna.edit") && (
                                        <DropdownMenuItem
                                            onClick={() => handleDelete(obj.id)}
                                            className="new-text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Eliminar
                                        </DropdownMenuItem>
                                    )}
                                    {hasPermission("users.historial") && (
                                        <DropdownMenuItem onClick={() => handleHistorial(obj.id, obj.num)}>
                                            <History className="h-4 w-4" />
                                            Historial
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </TooltipProvider>
                )
            },
        },
    ]

    if (!hasPermission("salidaexterna.view")) {
        return <div className="p-8 text-center text-muted-foreground">No tienes permiso para ver las Admin Gestión Externa.</div>
    }   

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Cargando Admin Gestión Externa...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Admin Gestión Externa</h1>
                    <p className="text-gray-600">Gestiona las salidas externas con origen y destino</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Inicio:</label>
                        <DatePicker date={selectedDate} onDateChange={handleDateChange} placeholder="dd/mm/aaaa" className="w-40" />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Fin:</label>
                        <DatePicker date={fechaFin} onDateChange={handleFechaFinChange} placeholder="dd/mm/aaaa" className="w-40" />
                    </div>
                </div>
            </div>

            <Card>
                <CardContent>
                    <div className="flex justify-between items-center">
                        <div></div>
                        {hasPermission("salidaexterna.edit") && (
                            <Button onClick={handleCreate} className="bg-primary hover:bg-primary-hover">
                                <Plus className="mr-2 h-4 w-4" />Nueva Salida Externa
                            </Button>
                        )}
                    </div>
                    <DataTable
                        columns={columns}
                        data={salidasExternas}
                        searchKey={["numFormateado", "fecha", "tipo", "salida", "destino", "conductorNombre", "gestorNombre", "fleteNombre"]}
                        searchPlaceholder="Buscar ..."
                    />
                </CardContent>
            </Card>

            <SalidaExternaDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                salidaExterna={selectedSalidaExterna}
                sedes={sedes}
                vehiculos={vehiculos}
                conductores={conductores}
                receptores={receptores}
                comerciales={comerciales}
                gestores={gestores}
                fletes={fletes}
                fletesGestion={fletesGestion}
                fletesFocus={fletesFocus}
                plantas={plantas}
                onSuccess={loadData}
                readOnly={dialogReadOnly}
                onVehiclesUpdate={loadData}
            />

            {selectedSalidaExterna && (
                <SalidaExternaCantidadesDialog
                    open={cantidadesDialogOpen}
                    onOpenChange={setCantidadesDialogOpen}
                    salidaExterna={selectedSalidaExterna}
                />
            )}
            <AdjuntosDialog open={adjuntosOpen} onOpenChange={setAdjuntosOpen} tipo="salidas-externas" entityId={actionId} title="Adjuntos de Gestión Externa" />
            <FirmaGeneradorDialog open={firmaOpen} onOpenChange={setFirmaOpen} visitaId={actionId} entityType="salidaExterna" />
            <PdfDialog open={pdfOpen} onOpenChange={setPdfOpen} base64={pdfBase64 || ""} />

            <HistorialDialog
                open={historialOpen}
                onOpenChange={setHistorialOpen}
                tipo="SalidaExterna"
                id={historialId}
                label={historialLabel}
            />
        </div>
    )
}
