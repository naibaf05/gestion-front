"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { ProgPath, Vehicle } from "@/types";
import { SelectSingle } from "../ui/select-single";
import { progService } from "@/services/progService";

interface ProgDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: ProgPath | null;
  vehiculos: Vehicle[];
  selectedDate: string;
  onSuccess: () => void;
}

export function ProgDialog({
  open,
  onOpenChange,
  item,
  vehiculos,
  selectedDate,
  onSuccess,
}: ProgDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ruta: "",
    rutaId: "",
    planta: "",
    vehiculoId: "",
    fecha: "",
    fechaFin: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    if (item) {
      setFormData({
        ruta: item.rutaNombre,
        rutaId: item.rutaId,
        planta: item.planta,
        vehiculoId: item.vehiculoId,
        fecha: item.fecha || selectedDate,
        fechaFin: item.fechaFin || selectedDate
      });
    } else {
      setFormData({
        ruta: "",
        rutaId: "",
        planta: "",
        vehiculoId: "",
        fecha: "",
        fechaFin: ""
      });
    }
  }, [item, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (item) {
        const response = await progService.update(formData);
        toast({
          title: "Actualizado",
          description: response.message || "El registro ha sido actualizado exitosamente",
          variant: "success"
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "No se pudo actualizar el registro",
        description: error.message || "Error inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Edición de Programación" : "Edición de Programación"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ruta">Ruta</Label>
                <Input
                  id="ruta"
                  value={formData.ruta}
                  onChange={e => setFormData({ ...formData, ruta: e.target.value })}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="planta">Planta</Label>
                <Input
                  id="planta"
                  value={formData.planta}
                  onChange={e => setFormData({ ...formData, planta: e.target.value })}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehiculoId" required>Vehículo</Label>
                <SelectSingle
                  id="vehiculoId"
                  placeholder="Seleccione un Vehículo"
                  options={vehiculos}
                  value={formData.vehiculoId}
                  onChange={v => setFormData({ ...formData, vehiculoId: v })}
                  valueKey="id"
                  labelKey="interno"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaFin" required>Fecha Fin</Label>
                <Input
                  id="fechaFin"
                  type="date"
                  value={formData.fechaFin}
                  onChange={e => setFormData({ ...formData, fechaFin: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary-hover">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : "Actualizar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
