"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Edit, PowerSquare } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ProgDialog } from "@/components/dialogs/ProgDialog";
import type { ColumnDef } from "@tanstack/react-table";
import { pathService } from "@/services/pathService";
import { Path } from "@/types";

export default function ExampleDashboardPage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [tab, setTab] = useState("tabla1");
  const [tabla, setTabla] = useState<Path[]>([]);
  const [tablaEventual, setTablaEventual] = useState<Path[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Path | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [data1, data2] = await Promise.all([
        pathService.getData(1, 100),
        pathService.getData(1, 100),
      ]);
      setTabla(data1.data);
      setTablaEventual(data2.data);
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

  const handleEdit = (item: Path) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const handleToggleStatus = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas cambiar el estado?")) {
      try {
        //await pathService.toggle(id);
        toast({
          title: "Estado actualizado",
          description: "El estado ha sido actualizado",
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

  const columns: ColumnDef<Path>[] = [
    {
      accessorKey: "nombre",
      header: "Nombre",
    },
    {
      accessorKey: "descripcion",
      header: "Descripción",
    },
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
        const item = row.original;
        return (
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleStatus(item.id)}
              className={item.activo ? "text-green-600" : "text-red-600"}
            >
              <PowerSquare className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Programación</h1>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="fecha" className="mr-2 font-medium">Fecha:</label>
          <input
            id="fecha"
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
      </div>
      <Card>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="tabla">Por Ruta</TabsTrigger>
              <TabsTrigger value="tablaEventual">Eventuales</TabsTrigger>
            </TabsList>
            <TabsContent value="tabla">
              <DataTable columns={columns} data={tabla} searchKey="nombre" searchPlaceholder="Buscar por nombre..." />
            </TabsContent>
            <TabsContent value="tablaEventual">
              <DataTable columns={columns} data={tablaEventual} searchKey="nombre" searchPlaceholder="Buscar por nombre..." />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <ProgDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={selectedItem}
        onSuccess={loadData}
      />
    </div>
  );
}
