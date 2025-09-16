"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, PowerSquare, Truck, Package } from "lucide-react";
import { clientService } from "@/services/clientService";
import { userService } from "@/services/userService";
import { parametrizationService } from "@/services/parametrizationService";
import { salidaService } from "@/services/salidaService";
import type { Salida, Sede, User, Parametrizacion } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { SalidaDialog } from "@/components/dialogs/SalidaDialog";
import type { ColumnDef } from "@tanstack/react-table";
import { useAuth } from "@/contexts/AuthContext";
import { ButtonTooltip } from "@/components/ui/button-tooltip";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function SalidasPage() {
  const { user } = useAuth();

  const [salidas, setSalidas] = useState<Salida[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [conductores, setConductores] = useState<User[]>([]);
  const [productos, setProductos] = useState<Parametrizacion[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSalida, setSelectedSalida] = useState<Salida | null>(null);
  const { toast } = useToast();

  if (user && user.permisos && typeof user.permisos === "string") {
    user.permisos = JSON.parse(user.permisos);
  }

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permisos) return false
    if (user.rolNombre === "ADMIN") return true
    return user.permisos[permission] === true
  }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        salidasData,
        sedesData,
        conductoresData,
        productosData,
      ] = await Promise.all([
        salidaService.getSalidas(),
        clientService.getSedes(),
        userService.getUsers(),
        parametrizationService.getListaActivos("t_residuos"),
      ]);
      setSalidas(salidasData);
      setSedes(sedesData);
      setConductores(conductoresData.filter(user => user.activo)); // Solo usuarios activos
      setProductos(productosData);
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
    setSelectedSalida(null);
    setDialogOpen(true);
  };

  const handleEdit = (salida: Salida) => {
    setSelectedSalida(salida);
    setDialogOpen(true);
  };

  const handleToggleStatus = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas cambiar el estado de esta salida?")) {
      try {
        await salidaService.toggleSalidaStatus(id);
        toast({
          title: "Estado actualizado",
          description: "El estado de la salida ha sido actualizado",
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

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'America/Bogota'
      });
    } catch {
      return dateString;
    }
  };

  const formatPeso = (peso: number) => {
    return `${peso.toFixed(2)} kg`;
  };

  const columns: ColumnDef<Salida>[] = [
    {
      accessorKey: "fecha",
      header: "Fecha",
      cell: ({ row }) => formatDate(row.getValue("fecha")),
    },
    {
      accessorKey: "sedeNombre",
      header: "Sede",
      cell: ({ row }) => {
        const sede = sedes.find((s) => s.id === row.original.sedeId);
        return sede ? `${sede.nombre} - ${sede.clienteNombre}` : "N/A";
      },
    },
    {
      accessorKey: "conductorNombre",
      header: "Conductor",
      cell: ({ row }) => {
        const conductor = conductores.find((c) => c.id === row.original.conductorId);
        return conductor ? conductor.nombreCompleto : "N/A";
      },
    },
    {
      accessorKey: "productoNombre",
      header: "Producto",
      cell: ({ row }) => {
        const producto = productos.find((p) => p.id === row.original.productoId);
        return producto?.nombre || "N/A";
      },
    },
    {
      accessorKey: "peso",
      header: "Peso",
      cell: ({ row }) => formatPeso(row.getValue("peso")),
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
        const salida = row.original;
        return (
          <TooltipProvider>
            <div className="flex items-center space-x-2">
              {hasPermission("salidas.edit") && (
                <>
                  <ButtonTooltip variant="ghost" size="sm" onClick={() => handleEdit(salida)} tooltipContent="Editar">
                    <Edit className="h-4 w-4" />
                  </ButtonTooltip>
                  <ButtonTooltip 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleToggleStatus(salida.id)}
                    tooltipContent={salida.activo ? "Desactivar" : "Activar"} 
                    className={salida.activo ? "new-text-green-600" : "new-text-red-600"}
                  >
                    <PowerSquare className="h-4 w-4" />
                  </ButtonTooltip>
                </>
              )}
            </div>
          </TooltipProvider>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando salidas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Salidas</h1>
          <p className="text-gray-600">Gestiona las salidas de residuos</p>
        </div>
        {hasPermission("salidas.edit") && (
          <Button onClick={handleCreate} className="bg-primary hover:bg-primary-hover">
            <Plus className="mr-2 h-4 w-4" />Nueva Salida
          </Button>
        )}
      </div>

      <Card>
        <CardContent>
          <DataTable
            columns={columns}
            data={salidas}
            searchKey={["sedeNombre", "conductorNombre", "productoNombre"]}
            searchPlaceholder="Buscar por sede, conductor o producto..."
          />
        </CardContent>
      </Card>

      <SalidaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        salida={selectedSalida}
        sedes={sedes.filter(sede => sede.activo)} // Solo sedes activas
        conductores={conductores}
        productos={productos}
        onSuccess={loadData}
      />
    </div>
  );
}
