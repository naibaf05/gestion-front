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
import type { Rate, Parametrizacion, VisitaCantidad, VisitaRecol } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { SelectSingle } from "../ui/select-single";
import { InputDecimal } from "../ui/input-decimal";
import { visitService } from "@/services/visitService";
import { InputPositiveInteger } from "../ui/input-positive-integer";

interface AmountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cantidad?: VisitaCantidad | null;
  visitaRecol: VisitaRecol;
  contenedores: Parametrizacion[];
  tiposResiduos: Parametrizacion[];
  onSuccess: () => void;
}

export function AmountDialog({
  open,
  onOpenChange,
  cantidad,
  visitaRecol,
  contenedores,
  tiposResiduos,
  onSuccess,
}: AmountDialogProps) {
  const [tarifas, setTarifas] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cantidad: "",
    tResiduoId: "",
    contenedorId: "",
    numContenedor: "",
    visitaRecolId: "",
    tarifaId: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    if (cantidad) {
      setFormData({
        cantidad: cantidad.cantidad,
        tResiduoId: cantidad.tResiduoId,
        contenedorId: cantidad.contenedorId,
        numContenedor: cantidad.numContenedor,
        visitaRecolId: cantidad.visitaRecolId,
        tarifaId: cantidad.tarifaId
      });
    } else {
      setFormData({
        cantidad: "",
        tResiduoId: "",
        contenedorId: "",
        numContenedor: "",
        visitaRecolId: visitaRecol.id,
        tarifaId: ""
      });
    }
  }, [cantidad, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (cantidad) {
        await visitService.updateCantidad(cantidad.id, formData);
        toast({
          title: "Cantidad actualizada",
          description: "La cantidad ha sido actualizada exitosamente",
          variant: "success",
        });
      } else {
        await visitService.createCantidad(formData);
        toast({
          title: "Cantidad creada",
          description: "La cantidad ha sido creada exitosamente",
          variant: "success",
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: cantidad ? "Error al actualizar la cantidad" : "Error al crear la cantidad",
        description: (error && error.message) ?
          error.message :
          cantidad
            ? "No se pudo actualizar la cantidad"
            : "No se pudo crear la cantidad",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{cantidad ? "Editar Cantidad" : "Nueva Cantidad"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tResiduoId">Tipo de Residuo *</Label>
                <SelectSingle
                  id="tResiduoId"
                  placeholder="Selecciona un tipo de residuo"
                  options={tiposResiduos}
                  value={formData.tResiduoId}
                  onChange={(value) => setFormData({ ...formData, tResiduoId: value })}
                  valueKey="id"
                  labelKey="nombre"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tarifaId">Tarifa</Label>
                <SelectSingle
                  id="tarifaId"
                  placeholder="Selecciona una tarifa"
                  options={tarifas}
                  value={formData.tarifaId}
                  onChange={(value) => setFormData({ ...formData, tarifaId: value })}
                  valueKey="id"
                  labelKey="tarifa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contenedorId">Contenedor *</Label>
                <SelectSingle
                  id="contenedorId"
                  placeholder="Selecciona un contenedor"
                  options={contenedores}
                  value={formData.contenedorId}
                  onChange={(value) => setFormData({ ...formData, contenedorId: value })}
                  valueKey="id"
                  labelKey="nombre"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numContenedor">Num Contenedor *</Label>
                <InputPositiveInteger
                  value={formData.numContenedor}
                  onChange={(e) => setFormData({ ...formData, numContenedor: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cantidad">Cantidad *</Label>
                <InputDecimal
                  id="cantidad"
                  value={formData.cantidad}
                  onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                  decimalPlaces={2}
                  placeholder="Ingrese una cantidad"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary-hover"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {cantidad ? "Actualizando..." : "Creando..."}
                </>
              ) : cantidad ? (
                "Actualizar"
              ) : (
                "Crear"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
