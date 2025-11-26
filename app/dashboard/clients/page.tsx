"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, PowerSquare, Trash2, Key, History, Eye } from "lucide-react";
import { clientService } from "@/services/clientService";
import { parametrizationService } from "@/services/parametrizationService";
import type { Cliente, Parametrizacion } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { ClientDialog } from "@/components/dialogs/ClientDialog";
import { PasswordDialog } from "@/components/dialogs/PasswordDialog";
import type { ColumnDef } from "@tanstack/react-table";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { ButtonTooltip } from "@/components/ui/button-tooltip";
import { HistorialDialog } from "@/components/dialogs/HistorialDialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";

export default function ClientsPage() {
  const { user, logout } = useAuth();

  const [clients, setClients] = useState<Cliente[]>([]);
  const [poblados, setPoblados] = useState<Parametrizacion[]>([]);
  const [comerciales, setComerciales] = useState<Parametrizacion[]>([]);
  const [tClientes, setTClientes] = useState<Parametrizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [historialOpen, setHistorialOpen] = useState(false);
  const [historialId, setHistorialId] = useState<string>("");
  const [historialLabel, setHistorialLabel] = useState<string>("");
  const { toast } = useToast();
  const [dialogReadOnly, setDialogReadOnly] = useState(false);

  if (user && user.permisos && typeof user.permisos === "string") {
    user.permisos = JSON.parse(user.permisos);
  }

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permisos) return false
    if (user.perfil?.nombre === "ADMIN") return true
    return user.permisos[permission] === true
  }

  const searchParams = useSearchParams();

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [clientToToggle, setClientToToggle] = useState<Cliente | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'create' && poblados.length > 0 && comerciales.length > 0 && tClientes.length > 0) {
      handleCreate()
      window.history.replaceState({}, '', '/dashboard/clients')
    }
  }, [searchParams, poblados, comerciales, tClientes]);

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
    setDialogReadOnly(false);
    setDialogOpen(true);
  };

  const handleEdit = (client: Cliente) => {
    setSelectedClient(client);
    setDialogReadOnly(false);
    setDialogOpen(true);
  };

  const handleView = (client: Cliente) => {
    setSelectedClient(client);
    setDialogReadOnly(true);
    setDialogOpen(true);
  };

  const handleToggleStatus = (client: Cliente) => {
    setClientToToggle(client);
    setStatusDialogOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!clientToToggle) return;
    try {
      await clientService.toggleClienteStatus(clientToToggle.id);
      toast({
        title: "Estado actualizado",
        description: "El estado del cliente ha sido actualizado",
        variant: "success",
      });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    } finally {
      setClientToToggle(null);
      setStatusDialogOpen(false);
    }
  };

  const cancelToggleStatus = () => {
    setClientToToggle(null);
    setStatusDialogOpen(false);
  }

  const handleHistorial = (id: string, nombre: string, nit: string) => {
    setHistorialId(id);
    setHistorialLabel(`Cliente [${nombre} - ${nit}]`);
    setHistorialOpen(true);
  };

  const columns: ColumnDef<Cliente>[] = [
    {
      accessorKey: "nit",
      header: "NIT",
      width: "150px",
    },
    {
      accessorKey: "nombre",
      header: "Nombre",
      width: "300px",
    },
    {
      accessorKey: "datosJson.nombreComercial",
      header: "Nombre Comercial",
      width: "300px",
    },
    {
      accessorKey: "tipoCliente",
      header: "Tipo de Cliente",
      width: "200px",
      enableColumnFilter: true
    },
    {
      accessorKey: "contacto",
      header: "Contacto",
      width: "180px",
    },
    {
      accessorKey: "poblado.nombre",
      header: "Municipio",
      cell: ({ row }) => {
        const poblado = poblados.find((p) => p.id === row.original.pobladoId);
        return poblado?.nombre || "N/A";
      },
      width: "100px",
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
      width: "100px",
    },
    {
      id: "actions",
      header: "Acciones",
      width: "180px",
      cell: ({ row }) => {
        const client = row.original;
        return (
          <TooltipProvider>
            <div className="flex items-center space-x-2">
              {hasPermission("clients.edit") ? (
                <>
                  <ButtonTooltip variant="ghost" size="sm" onClick={() => handleEdit(client)} tooltipContent="Editar">
                    <Edit className="h-4 w-4" />
                  </ButtonTooltip>
                  <ButtonTooltip variant="ghost" size="sm" onClick={() => handleToggleStatus(client)}
                    className={client.activo ? "new-text-green-600" : "new-text-red-600"}
                    tooltipContent={client.activo ? "Desactivar" : "Activar"}
                  >
                    <PowerSquare className="h-4 w-4" />
                  </ButtonTooltip>
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
                      <DropdownMenuItem onClick={() => handleChangePassword(client)} className="text-blue-600">
                        <Key className="h-4 w-4" />
                        Cambiar Contraseña
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(client)} className="new-text-red-600">
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                      {hasPermission("users.historial") && (
                        <DropdownMenuItem onClick={() => handleHistorial(client.id, client.nombre, client.nit)}>
                          <History className="h-4 w-4" />
                          Historial
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <ButtonTooltip variant="ghost" size="sm" onClick={() => handleView(client)} tooltipContent="Ver">
                    <Eye className="h-4 w-4" />
                  </ButtonTooltip>
                  {hasPermission("users.historial") && (
                    <ButtonTooltip variant="ghost" size="sm" onClick={() => handleHistorial(client.id, client.nombre, client.nit)} tooltipContent="Historial">
                      <History className="h-4 w-4" />
                    </ButtonTooltip>
                  )}
                </>
              )}
            </div>
          </TooltipProvider>
        );
      },
    },
  ];

  const handleDelete = (client: Cliente) => {
    setSelectedClient(client)
    setConfirmDialogOpen(true)
  }

  const handleChangePassword = (client: Cliente) => {
    setSelectedClient(client)
    setPasswordDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedClient) return

    try {
      await clientService.deleteCliente(selectedClient.id);
      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido eliminado exitosamente",
        variant: "success",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: (error && error.message ? error.message : "No se pudo eliminar el cliente"),
        variant: "destructive",
      });
    } finally {
      setSelectedClient(null)
    }
  }

  const cancelDelete = () => {
    setSelectedClient(null)
  }

  if (!hasPermission("clients.view")) {
    return <div className="p-8 text-center text-muted-foreground">No tienes permiso para ver clientes.</div>
  }

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
        {hasPermission("clients.edit") && (
          <Button
            onClick={handleCreate}
            className="bg-primary hover:bg-primary-hover"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Button>
        )}
      </div>

      <Card>
        <CardContent>
          <DataTable
            columns={columns}
            data={clients}
            layoutMode="fixed"
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
        readOnly={dialogReadOnly}
      />

      <ConfirmationDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Eliminar"
        description="¿Estás seguro de que deseas eliminar este cliente?"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      <ConfirmationDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        title="Cambiar estado del cliente"
        description={clientToToggle ? `¿Estás seguro de que deseas cambiar el estado del cliente "${clientToToggle.nombre}"?` : "¿Estás seguro de que deseas cambiar el estado de este cliente?"}
        confirmText="Cambiar Estado"
        cancelText="Cancelar"
        onConfirm={confirmToggleStatus}
        onCancel={cancelToggleStatus}
      />

      <PasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        displayName={selectedClient?.nombre || ""}
        clientId={selectedClient?.id || ""}
        onSuccess={loadData}
      />

      <HistorialDialog
        open={historialOpen}
        onOpenChange={setHistorialOpen}
        tipo="Cliente"
        id={historialId}
        label={historialLabel}
      />
    </div>
  );
}
