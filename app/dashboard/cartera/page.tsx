"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Upload, Loader2 } from "lucide-react";
import { carteraService } from "@/services/carteraService";
import type { Cartera } from "@/types";
import { useToast } from "@/hooks/use-toast";
import type { ColumnDef } from "@tanstack/react-table";

export default function CarteraPage() {
    const [cartera, setCartera] = useState<Cartera[]>([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const carteraData = await carteraService.getCartera();
            setCartera(carteraData);
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudieron cargar los datos de cartera",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleImport = () => {
        // Crear un input file temporal para seleccionar archivo
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls,.csv';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                setImporting(true);
                try {
                    await carteraService.importarCartera(file);
                    toast({
                        title: "Importación exitosa",
                        description: "Los datos de cartera han sido importados correctamente",
                    });
                    loadData(); // Recargar datos después de importar
                } catch (error) {
                    toast({
                        title: "Error",
                        description: "No se pudo importar el archivo",
                        variant: "destructive",
                    });
                } finally {
                    setImporting(false);
                }
            }
        };
        input.click();
    };

    const columns: ColumnDef<Cartera>[] = [
        {
            accessorKey: "clienteNit",
            header: "NIT",
        },
        {
            accessorKey: "clienteNombre",
            header: "Cliente",
        },
        {
            accessorKey: "documento",
            header: "Documento",
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Cargando cartera...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Cartera</h1>
                    <p className="text-gray-600">Gestiona la cartera de clientes</p>
                </div>
                <Button
                    onClick={handleImport}
                    disabled={importing}
                    className="bg-primary hover:bg-primary-hover"
                >
                    {importing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Importando...
                        </>
                    ) : (
                        <>
                            <Upload className="mr-2 h-4 w-4" />
                            Importar
                        </>
                    )}
                </Button>
            </div>

            <Card>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={cartera}
                        searchKey={["clienteNombre", "clienteNit", "documento"]}
                        searchPlaceholder="Buscar..."
                    />
                </CardContent>
            </Card>
        </div>
    );
}