"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { historialService, type HistorialItem } from "@/services/historialService";
import { useToast } from "@/hooks/use-toast";
import { Loader2, History } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface HistorialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: string;
  id: string | number;
  label?: string; // Nuevo prop opcional para el label personalizado
}

export function HistorialDialog({
  open,
  onOpenChange,
  tipo,
  id,
  label,
}: HistorialDialogProps) {
  const [loading, setLoading] = useState(false);
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open && tipo && id) {
      fetchHistorial();
    }
  }, [open, tipo, id]);

  const fetchHistorial = async () => {
    setLoading(true);
    try {
      const response = await historialService.getHistorial(tipo, id);
      if (response.success) {
        setHistorial(response.data);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.message || "No se pudo cargar el historial",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al cargar el historial",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAccionBadgeVariant = (accion: string) => {
    switch (accion.toUpperCase()) {
      case "CREAR":
        return "default";
      case "ACTUALIZAR":
        return "secondary";
      case "ELIMINAR":
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatFecha = (fecha: string) => {
    try {
      return format(new Date(fecha), "dd/MM/yyyy HH:mm", { locale: es });
    } catch {
      return fecha;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Cambios - {label || `${tipo} #${id}`}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : historial.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay registros de historial
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Acción</TableHead>
                  <TableHead className="w-[150px]">Fecha</TableHead>
                  <TableHead className="w-[120px]">Usuario</TableHead>
                  <TableHead>Observación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historial.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge variant={getAccionBadgeVariant(item.accion)}>
                        {item.accion}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatFecha(item.fecha)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.usuario}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="max-w-md whitespace-pre-wrap">
                        {transformObservacion(item.observacion)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const REPLACEMENTS: { pattern: RegExp; replacement: string }[] = [
  { pattern: /;\s*/g, replacement: ";\n" },
  { pattern: /fechaRenovacion:/g, replacement: "Fecha de Renovación:" },
  { pattern: /datosJson\.correoFacturacion:/g, replacement: "Correo Facturación:" },
  { pattern: /datosJson\.correo:\s?/g, replacement: "Correo:" },
  { pattern: /datosJson\.fechaCierreFacturacion:\s?/g, replacement: "Fecha Cierre Facturación:" },
];

function transformObservacion(observacion: string | undefined | null): string {
  if (!observacion) return "";
  let out = observacion;
  for (const { pattern, replacement } of REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}
