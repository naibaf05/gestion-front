"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, PowerSquare } from "lucide-react";
import { clientService } from "@/services/clientService";
import { parametrizationService } from "@/services/parametrizationService";
import type { Cliente, Parametrizacion } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { ClientDialog } from "@/components/dialogs/ClientDialog";
import type { ColumnDef } from "@tanstack/react-table";

export default function ClientsPage() {
  const [clients, setClients] = useState<Cliente[]>([]);
  const [poblados, setPoblados] = useState<Parametrizacion[]>([]);
  const [comerciales, setComerciales] = useState<Parametrizacion[]>([]);
  const [tClientes, setTClientes] = useState<Parametrizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clientsData, pobladosData, comercialesData, tClientesData] = await Promise.all([
        clientService.getClientes(),
        parametrizationService.getListaActivos("poblado"),
        parametrizationService.getListaActivos("comercial"),
        parametrizationService.getListaActivos("t_cliente"),
      ]);

      const tipoClienteMap = tClientesData.reduce((acc: any, tipo) => {
        acc[tipo.id] = tipo.nombre;
        return acc;
      }, {});

      clientsData.forEach(client => {
        let t_cliente = '';
        if (client.datosJson && Array.isArray(client.datosJson.tiposClienteIds) && client.datosJson.tiposClienteIds.length > 0) {
          const nombres = client.datosJson.tiposClienteIds
            .map((tipoId: string) => tipoClienteMap[tipoId])
            .filter((nombre: string) => !!nombre);

          t_cliente = nombres.join(",");
        }
        client.tipoCliente = t_cliente;
      });

      setClients(clientsData);
      setPoblados(pobladosData);
      setComerciales(comercialesData);
      setTClientes(tClientesData);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedClient(null);
    setDialogOpen(true);
  };

  const handleEdit = (client: Cliente) => {
    setSelectedClient(client);
    setDialogOpen(true);
  };

  const handleToggleStatus = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas cambiar el estado a este cliente?")) {
      try {
        await clientService.toggleClienteStatus(id);
        toast({
          title: "Estado actualizado",
          description: "El estado del cliente ha sido actualizado",
        });
        loadData();
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo actualizar el estado",
          variant: "destructive",
        });
      }
    }
  };

  const columns: ColumnDef<Cliente>[] = [
    {
      accessorKey: "nit",
      header: "NIT",
    },
    {
      accessorKey: "nombre",
      header: "Nombre",
    },
    {
      accessorKey: "datosJson.nombreComercial",
      header: "Nombre Comercial",
    },
    {
      accessorKey: "tipoCliente",
      header: "Tipo de Cliente",
      enableColumnFilter: true
    },
    {
      accessorKey: "contacto",
      header: "Contacto",
    },
    {
      accessorKey: "poblado.nombre",
      header: "Municipio",
      cell: ({ row }) => {
        const poblado = poblados.find((p) => p.id === row.original.pobladoId);
        return poblado?.nombre || "N/A";
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
        );
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const client = row.original;
        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(client)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleStatus(client.id)}
              className={client.activo ? "text-green-600" : "text-red-600"}
            >
              <PowerSquare className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600">Gestiona los clientes del sistema</p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-primary hover:bg-primary-hover"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      <Card>
        <CardContent>
          <DataTable
            columns={columns}
            data={clients}
            searchKey={["nombre", "nit", "datosJson.nombreComercial", "tipoCliente"]}
            searchPlaceholder="Buscar..."
          />
        </CardContent>
      </Card>

      <ClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={selectedClient}
        poblados={poblados}
        comerciales={comerciales}
        tClientes={tClientes}
        onSuccess={loadData}
      />
    </div>
  );
}
