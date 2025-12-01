"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Edit, FileText, Plus, PowerSquare, Table, Trash2, History } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CertificadoDialog } from "@/components/dialogs/CertificadoDialog";
import type { ColumnDef } from "@tanstack/react-table";
import { certificatesService } from "@/services/certificatesService";
import { clientService } from "@/services/clientService";
import type { Certificados, Cliente, Sede } from "@/types";
import { PdfDialog } from "@/components/dialogs/PdfDialog";
import { ButtonTooltip } from "@/components/ui/button-tooltip";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { HistorialDialog } from "@/components/dialogs/HistorialDialog";

export default function CertificadosPage() {
    const { user, logout } = useAuth()

    const [base64, setBase64] = useState<string | null>(null)
    const [dialogPdfOpen, setDialogPdfOpen] = useState(false);

    const [tab, setTab] = useState("llantas");
    const [certificadosLlantas, setCertificadosLlantas] = useState<Certificados[]>([]);
    const [certificadosOtros, setCertificadosOtros] = useState<Certificados[]>([]);
    const [certificadosProforma, setCertificadosProforma] = useState<Certificados[]>([]);
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);

    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedCertificado, setSelectedCertificado] = useState<Certificados | null>(null);
    const [tipo, setTipo] = useState("1");
    const { toast } = useToast();
    // Historial
    const [historialOpen, setHistorialOpen] = useState(false);
    const [historialId, setHistorialId] = useState<string>("");
    const [historialLabel, setHistorialLabel] = useState<string>("");

    // Estados para mensajes de confirmación similares a progs-admin
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [tipoConfirm, setTipoConfirm] = useState<string | null>(null);
    const [titleConfirm, setTitleConfirm] = useState<string | null>(null);
    const [descripcionConfirm, setDescripcionConfirm] = useState<string | null>(null);
    const [confirmText, setConfirmText] = useState<string | null>(null);
    const [cancelText, setCancelText] = useState<string | null>(null);
    const [hideCancelConfirm, setHideCancelConfirm] = useState<boolean>(false);

    if (user && user.permisos && typeof user.permisos === "string") {
        user.permisos = JSON.parse(user.permisos);
    }

    const hasPermission = (permission: string): boolean => {
        if (!user || !user.permisos) return false
        if (user.perfil?.nombre === "ADMIN") return true
        return user.permisos[permission] === true
    }

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            if (user?.perfil?.nombre === "CLIENTE") {
                const [llantasData, otrosData, proformaData, sedesData, clientesData] = await Promise.all([
                    certificatesService.getCertificadosCliente("1", user.id || ""),
                    certificatesService.getCertificadosCliente("2", user.id || ""),
                    certificatesService.getCertificadosCliente("3", user.id || ""),
                    clientService.getSedesActivas(),
                    clientService.getClientesActivos()
                ]);
                setCertificadosLlantas(llantasData);
                setCertificadosOtros(otrosData);
                setCertificadosProforma(proformaData);
                setSedes(sedesData);
                setClientes(clientesData);
            } else {
                const [llantasData, otrosData, proformaData, sedesData, clientesData] = await Promise.all([
                    certificatesService.getCertificados("1"),
                    certificatesService.getCertificados("2"),
                    certificatesService.getCertificados("3"),
                    clientService.getSedesActivas(),
                    clientService.getClientesActivos()
                ]);
                setCertificadosLlantas(llantasData);
                setCertificadosOtros(otrosData);
                setCertificadosProforma(proformaData);
                setSedes(sedesData);
                setClientes(clientesData);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudieron cargar los certificados",
                variant: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = (tipo: string) => {
        setSelectedCertificado(null);
        setTipo(tipo);
        setDialogOpen(true);
    };

    const handleEdit = (item: Certificados) => {
        setSelectedCertificado(item);
        setTipo(String(item.tipo));
        setDialogOpen(true);
    };

    const handlePdf = async (obj: Certificados) => {
        // Guardar el certificado seleccionado para acciones posteriores
        setSelectedCertificado(obj);

        // Replicar validaciones de progs-admin
        if ((obj as any).tieneCartera === 1) {
            setTipoConfirm("cartera");
            setTitleConfirm("Certificado no disponible");
            setDescripcionConfirm("Estimado usuario, para poder acceder al certificado solicitado, es necesario que se encuentre al día en su estado de cuenta. Por favor, regularice su cartera pendiente para habilitar la descarga.");
            setConfirmText("Entendido");
            setCancelText("");
            setHideCancelConfirm(true);
            setConfirmDialogOpen(true);
            return;
        }

        if ((obj as any).noFactura === 1) {
            setTipoConfirm("pdf-no-facturado");
            setTitleConfirm("Certificado no disponible");
            setDescripcionConfirm("El servicio asociado a este certificado aún no ha sido facturado. Una vez se emita la factura correspondiente y realice el pago correspondiente, el sistema habilitará la descarga del documento.");
            setConfirmText("Entendido");
            setCancelText("");
            setHideCancelConfirm(true);
            setConfirmDialogOpen(true);
            return;
        }

        handlePdfNoValidate(obj);
    }

    const handlePdfNoValidate = async (obj: Certificados) => {
        let base64;
        const tipoString = String(obj.tipo);

        switch (tipoString) {
            case "1":
                base64 = await certificatesService.getCertificadoRecoleccionLlantasPDF(obj.id || "", obj.clienteId || "", obj.sedeId || "", obj.inicio, obj.fin, obj.num, obj.fecha);
                break;
            case "2":
                base64 = await certificatesService.getCertificadoRecoleccionPDF(obj.id || "", obj.clienteId || "", obj.sedeId || "", obj.inicio, obj.fin, obj.num, obj.fecha);
                break;
            case "3":
                base64 = await certificatesService.getCertificadoProformaPDF(obj.clienteId || "", obj.sedeId || "", obj.inicio, obj.fin, obj.fecha, obj.notas || "");
                break;
            default:
                base64 = null;
                break;
        }
        if (!base64) {
            toast({
                title: "Error",
                description: "No se pudo generar el PDF",
                variant: "error",
            });
            return;
        }
        setBase64(base64);
        setDialogPdfOpen(true);
    }

    const handleExcel = async (obj: Certificados) => {
        setSelectedCertificado(obj);
        // Validaciones previas igual que PDF
        if ((obj as any).tieneCartera === 1) {
            setTipoConfirm("cartera-excel");
            setTitleConfirm("Certificado no disponible");
            setDescripcionConfirm("Estimado usuario, para poder acceder al certificado solicitado, es necesario que se encuentre al día en su estado de cuenta. Por favor, regularice su cartera pendiente para habilitar la descarga.");
            setConfirmText("Entendido");
            setCancelText("");
            setHideCancelConfirm(true);
            setConfirmDialogOpen(true);
            return;
        }
        if ((obj as any).noFactura === 1) {
            setTipoConfirm("excel-no-facturado");
            setTitleConfirm("Certificado no disponible");
            setDescripcionConfirm("El servicio asociado a este certificado aún no ha sido facturado. Una vez se emita la factura correspondiente y realice el pago correspondiente, el sistema habilitará la descarga del documento.");
            setConfirmText("Entendido");
            setCancelText("");
            setHideCancelConfirm(true);
            setConfirmDialogOpen(true);
            return;
        }
        handleExcelNoValidate(obj);
    }

    const handleExcelNoValidate = async (obj: Certificados) => {
        let base64;
        const tipoString = String(obj.tipo);
        switch (tipoString) {
            case "3":
                base64 = await certificatesService.getCertificadoProformaExcel(obj.clienteId || "", obj.sedeId || "", obj.inicio, obj.fin, obj.fecha, obj.notas || "");
                break;
            default:
                base64 = null; // Solo proforma soporta Excel actualmente
                break;
        }
        if (!base64) {
            toast({
                title: "Error",
                description: "No se pudo generar el Excel",
                variant: "error",
            });
            return;
        }
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const fileName = `Certificado_Proforma_${obj.sedeNombre || 'Sede'}_${obj.inicio}_${obj.fin}.xlsx`;
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
            description: `El archivo ${fileName} se está descargando`,
            variant: "success",
        });
    }

    const handleToggleStatus = async (id: string) => {
        if (window.confirm("¿Estás seguro de que deseas desactivar este certificado?")) {
            try {
                await certificatesService.toggleStatus(id);
                toast({
                    title: "Desactivado",
                    description: "El certificado ha sido desactivado correctamente",
                    variant: "success"
                });
                loadData();
            } catch (error: any) {
                toast({
                    title: "Error",
                    description: (error && error.message) ?
                        error.message : "No se pudo desactivar el certificado",
                    variant: "error",
                })
            }
        }
    };

    const handleConfirmDialog = async () => {
        try {
            if (tipoConfirm === "pdf-no-facturado" || tipoConfirm === "cartera") {
                if (selectedCertificado && user?.perfil?.nombre === "CLIENTE") {
                    handlePdfNoValidate(selectedCertificado);
                }
            } else if (tipoConfirm === "excel-no-facturado" || tipoConfirm === "cartera-excel") {
                if (selectedCertificado && user?.perfil?.nombre === "CLIENTE") {
                    handleExcelNoValidate(selectedCertificado);
                }
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.message || "No se pudo realizar la acción",
                variant: "error",
            });
        } finally {
            setConfirmDialogOpen(false);
            setTipoConfirm(null);
            setTitleConfirm(null);
            setDescripcionConfirm(null);
            setConfirmText(null);
            setCancelText(null);
            setHideCancelConfirm(false);
        }
    };

    const handleCancelDialog = () => {
        setConfirmDialogOpen(false);
        setTipoConfirm(null);
    };

    const handleHistorial = (item: Certificados) => {
        setSelectedCertificado(item);
        setHistorialId(item.id || "");
        const nombre = item.sedeNombre || item.clienteNombre || "";
        setHistorialLabel(`Certificado [${nombre}]`);
        setHistorialOpen(true);
    };

    const columns: ColumnDef<Certificados>[] = [
        {
            accessorKey: "clienteNombre",
            header: "Cliente",
        },
        {
            accessorKey: "sedeNombre",
            header: "Sede",
        },
        {
            accessorKey: "inicio",
            header: "Fecha Inicio",
        },
        {
            accessorKey: "fin",
            header: "Fecha Fin",
        },
        {
            accessorKey: "activo",
            header: "Estado",
            cell: ({ row }) => (
                <span className={`px-2 py-1 rounded text-xs ${row.original.activo
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    {row.original.activo ? 'Activo' : 'Inactivo'}
                </span>
            ),
        },
        {
            id: "actions",
            header: "Acciones",
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <TooltipProvider>
                        <div className="flex items-center space-x-2">
                            <ButtonTooltip variant="ghost" size="sm" onClick={() => handlePdf(item)} tooltipContent="PDF">
                                <FileText className="h-4 w-4" />
                            </ButtonTooltip>
                            {hasPermission("users.historial") && (
                                <ButtonTooltip variant="ghost" size="sm" onClick={() => handleHistorial(item)} tooltipContent="Historial">
                                    <History className="h-4 w-4" />
                                </ButtonTooltip>
                            )}
                            {hasPermission("certificados.edit") && (
                                <ButtonTooltip
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleToggleStatus(item.id)}
                                    className={item.activo ? "new-text-green-600" : "new-text-red-600"}
                                    tooltipContent={item.activo ? "Desactivar" : "Activar"}
                                >
                                    <PowerSquare className="h-4 w-4" />
                                </ButtonTooltip>
                            )}
                        </div>
                    </TooltipProvider>
                );
            },
        },
    ];

    const columnsProforma: ColumnDef<Certificados>[] = [
        {
            accessorKey: "clienteNombre",
            header: "Cliente",
        },
        {
            accessorKey: "sedeNombre",
            header: "Sede",
        },
        {
            accessorKey: "inicio",
            header: "Fecha Inicio",
        },
        {
            accessorKey: "fin",
            header: "Fecha Fin",
        },
        {
            accessorKey: "activo",
            header: "Estado",
            cell: ({ row }) => (
                <span className={`px-2 py-1 rounded text-xs ${row.original.activo
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    {row.original.activo ? 'Activo' : 'Inactivo'}
                </span>
            ),
        },
        {
            id: "actions",
            header: "Acciones",
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <TooltipProvider>
                        <div className="flex items-center space-x-2">
                            {hasPermission("certificados.edit") && (
                                <ButtonTooltip variant="ghost" size="sm" onClick={() => handleEdit(item)} tooltipContent="Editar">
                                    <Edit className="h-4 w-4" />
                                </ButtonTooltip>
                            )}
                            {hasPermission("certificados.edit") && (
                                <ButtonTooltip variant="ghost" size="sm" onClick={() => handleToggleStatus(item.id)}
                                    className={item.activo ? "new-text-green-600" : "new-text-red-600"}
                                    tooltipContent={item.activo ? "Desactivar" : "Activar"}
                                >
                                    <PowerSquare className="h-4 w-4" />
                                </ButtonTooltip>
                            )}
                            <DropdownMenu>
                                <Tooltip>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                            <span className="sr-only">Más acciones</span>
                                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                                                <circle cx="5" cy="12" r="2" fill="currentColor" />
                                                <circle cx="12" cy="12" r="2" fill="currentColor" />
                                                <circle cx="19" cy="12" r="2" fill="currentColor" />
                                            </svg>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <TooltipContent>Más acciones</TooltipContent>
                                </Tooltip>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handlePdf(item)}>
                                        <FileText className="h-4 w-4" />
                                        PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExcel(item)}>
                                        <Table className="h-4 w-4" />
                                        Excel
                                    </DropdownMenuItem>
                                    {hasPermission("users.historial") && (
                                        <DropdownMenuItem onClick={() => handleHistorial(item)}>
                                            <History className="h-4 w-4" />
                                            Historial
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </TooltipProvider>
                );
            },
        },
    ];

    if (!hasPermission("certificados.view")) {
        return <div className="p-8 text-center text-muted-foreground">No tienes permiso para ver los certificados.</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Certificados</h1>
                </div>
            </div>

            <Card>
                <CardContent>
                    <Tabs value={tab} onValueChange={setTab} className="w-full">
                        <TabsList className="mb-4">
                            <TabsTrigger value="llantas">Llantas</TabsTrigger>
                            <TabsTrigger value="otros">Residuos</TabsTrigger>
                            {user?.perfil?.nombre === "CLIENTE" && (<TabsTrigger value="proforma">Proforma</TabsTrigger>)}
                        </TabsList>

                        <TabsContent value="llantas">
                            <div className="flex justify-between items-center mb-4">
                                <div></div>
                                {hasPermission("certificados.edit") && (
                                    <Button onClick={() => handleCreate("1")} className="bg-primary hover:bg-primary-hover">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Nuevo Certificado
                                    </Button>
                                )}
                            </div>
                            <DataTable
                                columns={columns}
                                data={certificadosLlantas}
                                searchKey={["sedeNombre", "clienteNombre"]}
                                searchPlaceholder="Buscar ..."
                            />
                        </TabsContent>

                        <TabsContent value="otros">
                            <div className="flex justify-between items-center mb-4">
                                <div></div>
                                {hasPermission("certificados.edit") && (
                                    <Button onClick={() => handleCreate("2")} className="bg-primary hover:bg-primary-hover">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Nuevo Certificado
                                    </Button>
                                )}
                            </div>
                            <DataTable
                                columns={columns}
                                data={certificadosOtros}
                                searchKey={["sedeNombre", "clienteNombre"]}
                                searchPlaceholder="Buscar ..."
                            />
                        </TabsContent>

                        <TabsContent value="proforma">
                            <div className="flex justify-between items-center mb-4">
                                <div></div>
                                {hasPermission("certificados.edit") && (
                                    <Button onClick={() => handleCreate("3")} className="bg-primary hover:bg-primary-hover">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Nuevo Certificado
                                    </Button>
                                )}
                            </div>
                            <DataTable
                                columns={columnsProforma}
                                data={certificadosProforma}
                                searchKey={["sedeNombre", "clienteNombre"]}
                                searchPlaceholder="Buscar ..."
                            />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <CertificadoDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                certificado={selectedCertificado}
                sedes={sedes}
                clientes={clientes}
                onSuccess={loadData}
                tipo={tipo}
            />

            <ConfirmationDialog
                open={confirmDialogOpen}
                onOpenChange={setConfirmDialogOpen}
                title={titleConfirm || "Confirmar"}
                description={descripcionConfirm || "¿Estás seguro?"}
                confirmText={confirmText || undefined}
                cancelText={cancelText || undefined}
                hideCancel={hideCancelConfirm}
                onConfirm={handleConfirmDialog}
                onCancel={handleCancelDialog}
            />

            {base64 && (
                <PdfDialog
                    open={dialogPdfOpen}
                    onOpenChange={setDialogPdfOpen}
                    base64={base64}
                />
            )}

            <HistorialDialog
                open={historialOpen}
                onOpenChange={setHistorialOpen}
                tipo="Certificado"
                id={historialId}
                label={historialLabel}
            />
        </div>
    );
}
