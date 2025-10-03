"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Edit, FileText, Plus, PowerSquare, Trash2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CertificadoDialog } from "@/components/dialogs/CertificadoDialog";
import type { ColumnDef } from "@tanstack/react-table";
import { certificatesService } from "@/services/certificatesService";
import { clientService } from "@/services/clientService";
import type { Certificados, Sede } from "@/types";
import { PdfDialog } from "@/components/dialogs/PdfDialog";
import { ButtonTooltip } from "@/components/ui/button-tooltip";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { es } from "date-fns/locale";

export default function CertificadosPage() {
    const { user, logout } = useAuth()

    const [base64, setBase64] = useState<string | null>(null)
    const [dialogPdfOpen, setDialogPdfOpen] = useState(false);

    const [tab, setTab] = useState("llantas");
    const [certificadosLlantas, setCertificadosLlantas] = useState<Certificados[]>([]);
    const [certificadosOtros, setCertificadosOtros] = useState<Certificados[]>([]);
    const [certificadosProforma, setCertificadosProforma] = useState<Certificados[]>([]);
    const [sedes, setSedes] = useState<Sede[]>([]);

    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedCertificado, setSelectedCertificado] = useState<Certificados | null>(null);
    const [tipo, setTipo] = useState<"1" | "2" | "3">("1");
    const { toast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            if (user && user.rolNombre === "CLIENTE") {
                const [llantasData, otrosData, proformaData, sedesData] = await Promise.all([
                    certificatesService.getCertificadosCliente("1", "11"),
                    certificatesService.getCertificadosCliente("2", "11"),
                    certificatesService.getCertificadosCliente("3", "11"),
                    clientService.getSedesActivas()
                ]);
                setCertificadosLlantas(llantasData);
                setCertificadosOtros(otrosData);
                setCertificadosProforma(proformaData);
                setSedes(sedesData);
            } else {
                const [llantasData, otrosData, proformaData, sedesData] = await Promise.all([
                    certificatesService.getCertificados("1"),
                    certificatesService.getCertificados("2"),
                    certificatesService.getCertificados("3"),
                    clientService.getSedesActivas()
                ]);
                setCertificadosLlantas(llantasData);
                setCertificadosOtros(otrosData);
                setCertificadosProforma(proformaData);
                setSedes(sedesData);
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

    const handleCreate = (tipo: "1" | "2" | "3") => {
        setSelectedCertificado(null);
        setTipo(tipo);
        setDialogOpen(true);
    };

    const handleEdit = (item: Certificados, tipo: "1" | "2" | "3") => {
        setSelectedCertificado(item);
        setTipo(tipo);
        setDialogOpen(true);
    };

    const handlePdf = async (obj: Certificados) => {
        console.log("Generating PDF for:", obj);
        console.log("Tipo value:", obj.tipo, "Type:", typeof obj.tipo);
        let base64;

        // Convertir tipo a string para asegurar compatibilidad
        const tipoString = String(obj.tipo);

        switch (tipoString) {
            case "1":
                base64 = null;
                break;
            case "2":
                base64 = await certificatesService.getCertificadoRecoleccionPDF(obj.sedeId, obj.inicio, obj.fin, obj.num, obj.fecha);
                break;
            case "3":
                base64 = await certificatesService.getCertificadoProformaPDF(obj.sedeId, obj.inicio, obj.fin, obj.fecha, obj.notas || "");
                break;
            default:
                base64 = null;
                break;
        }
        console.log("Received base64:", base64);
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

    const handleToggleStatus = async (id: string) => {
        if (confirm("¿Estás seguro de que deseas desactivar este certificado?")) {
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES');
    };

    const columns: ColumnDef<Certificados>[] = [
        {
            accessorKey: "sedeNombre",
            header: "Sede",
        },
        {
            accessorKey: "inicio",
            header: "Fecha Inicio",
            cell: ({ row }) => formatDate(row.original.inicio),
        },
        {
            accessorKey: "fin",
            header: "Fecha Fin",
            cell: ({ row }) => formatDate(row.original.fin),
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
                            <ButtonTooltip
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleStatus(item.id)}
                                className={item.activo ? "new-text-green-600" : "new-text-red-600"}
                                tooltipContent={item.activo ? "Desactivar" : "Activar"}
                            >
                                <PowerSquare className="h-4 w-4" />
                            </ButtonTooltip>
                        </div>
                    </TooltipProvider>
                );
            },
        },
    ];

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
                            <TabsTrigger value="proforma">Proforma</TabsTrigger>
                        </TabsList>

                        <TabsContent value="llantas">
                            <div className="flex justify-between items-center mb-4">
                                <div></div>
                                <Button onClick={() => handleCreate("1")} className="bg-primary hover:bg-primary-hover">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nuevo Certificado
                                </Button>
                            </div>
                            <DataTable
                                columns={columns}
                                data={certificadosLlantas}
                                searchKey="sedeNombre"
                                searchPlaceholder="Buscar por sede..."
                            />
                        </TabsContent>

                        <TabsContent value="otros">
                            <div className="flex justify-between items-center mb-4">
                                <div></div>
                                <Button onClick={() => handleCreate("2")} className="bg-primary hover:bg-primary-hover">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nuevo Certificado
                                </Button>
                            </div>
                            <DataTable
                                columns={columns}
                                data={certificadosOtros}
                                searchKey="sedeNombre"
                                searchPlaceholder="Buscar por sede..."
                            />
                        </TabsContent>

                        <TabsContent value="proforma">
                            <div className="flex justify-between items-center mb-4">
                                <div></div>
                                <Button onClick={() => handleCreate("3")} className="bg-primary hover:bg-primary-hover">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nuevo Certificado
                                </Button>
                            </div>
                            <DataTable
                                columns={columns}
                                data={certificadosProforma}
                                searchKey="sedeNombre"
                                searchPlaceholder="Buscar por sede..."
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
                onSuccess={loadData}
                tipo={tipo}
            />

            {base64 && (
                <PdfDialog
                    open={dialogPdfOpen}
                    onOpenChange={setDialogPdfOpen}
                    base64={base64}
                />
            )}
        </div>
    );
}
