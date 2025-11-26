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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Path, Sede } from "@/types";
import { SelectSingle } from "../ui/select-single";
import { progService } from "@/services/progService";

interface ProgEvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rutas: Path[];
  sedes: Sede[];
  selectedDate: string;
  onSuccess: () => void;
}

export function ProgEvDialog({
  open,
  onOpenChange,
  rutas,
  sedes,
  selectedDate,
  onSuccess,
}: ProgEvDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    rutaId: "",
    sedeId: "",
    fecha: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    setFormData({
      rutaId: "",
      sedeId: "",
      fecha: selectedDate
    });
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await progService.createEv(selectedDate, formData);
      toast({
        title: "Creado",
        description: "El registro ha sido creado exitosamente",
        variant: "success"
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error Creación",
        description: (error && error.message) ?
          error.message : "No se pudo crear el registro",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Programación Eventual</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sedeId" required>Sede</Label>
                <SelectSingle
                  id="sedeId"
                  placeholder="Seleccione una Sede"
                  options={sedes}
                  value={formData.sedeId}
                  onChange={v => setFormData({ ...formData, sedeId: v })}
                  valueKey="id"
                  labelKey="nombre"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rutaId" required>Ruta</Label>
                <SelectSingle
                  id="rutaId"
                  placeholder="Seleccione una Ruta"
                  options={rutas}
                  value={formData.rutaId}
                  onChange={v => setFormData({ ...formData, rutaId: v })}
                  valueKey="id"
                  labelKey="nombre"
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
                  Guardando...
                </>
              ) : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
