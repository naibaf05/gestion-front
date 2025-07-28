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
import { rateService } from "@/services/rateService";
import type { Rate, Sede, Parametrizacion } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { SelectSingle } from "../ui/select-single";
import { InputDecimal } from "../ui/input-decimal";
import { InputCheck } from "../ui/input-check";

interface RateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rate?: Rate | null;
  sede?: Sede | null;
  undMedidas: Parametrizacion[];
  tiposResiduos?: Parametrizacion[];
  onSuccess: () => void;
}

export function RateDialog({
  open,
  onOpenChange,
  rate,
  sede,
  undMedidas,
  tiposResiduos = [],
  onSuccess,
}: RateDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sedeId: "",
    undMedidaId: "",
    tipoResiduoId: "",
    tarifa: "",
    fechaInicio: "",
    fechaFin: "",
    puestoPlanta: false
  });
  const { toast } = useToast();

  useEffect(() => {
    if (rate) {
      setFormData({
        sedeId: sede ? sede.id : "",
        undMedidaId: rate.undMedidaId,
        tipoResiduoId: rate.tipoResiduoId,
        tarifa: rate.tarifa,
        fechaInicio: rate.fechaInicio,
        fechaFin: rate.fechaFin ?? "",
        puestoPlanta: rate.puestoPlanta ?? false,
      });
    } else {
      setFormData({
        sedeId: sede ? sede.id : "",
        undMedidaId: "",
        tipoResiduoId: "",
        tarifa: "",
        fechaInicio: "",
        fechaFin: "",
        puestoPlanta: false
      });
    }
  }, [rate, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (rate) {
        await rateService.update(rate.id, formData);
        toast({
          title: "Tarifa actualizada",
          description: "La tarifa ha sido actualizada exitosamente",
          variant: "success",
        });
      } else {
        await rateService.create(formData);
        toast({
          title: "Tarifa creada",
          description: "La tarifa ha sido creada exitosamente",
          variant: "success",
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: rate ? "Error al actualizar la tarifa" : "Error al crear la tarifa",
        description: (error && error.message) ?
          error.message :
          rate
            ? "No se pudo actualizar la tarifa"
            : "No se pudo crear la tarifa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rate ? "Editar Tarifa" : "Nueva Tarifa"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="undMedidaId">Unidad de Medida *</Label>
                <SelectSingle
                  id="undMedidaId"
                  placeholder="Selecciona una unidad de medida"
                  options={undMedidas}
                  value={formData.undMedidaId}
                  onChange={(value) => setFormData({ ...formData, undMedidaId: value })}
                  valueKey="id"
                  labelKey="nombre"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipoResiduoId">Tipo de Residuo *</Label>
                <SelectSingle
                  id="tipoResiduoId"
                  placeholder="Selecciona un tipo de residuo"
                  options={tiposResiduos}
                  value={formData.tipoResiduoId}
                  onChange={(value) => setFormData({ ...formData, tipoResiduoId: value })}
                  valueKey="id"
                  labelKey="nombre"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaInicio">Fecha Inicio *</Label>
                <Input
                  id="fechaInicio"
                  type="date"
                  value={formData.fechaInicio}
                  onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaFin">Fecha Fin</Label>
                <Input
                  id="fechaFin"
                  type="date"
                  value={formData.fechaFin}
                  onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tarifa">Tarifa *</Label>
                <InputDecimal
                  id="tarifa"
                  value={formData.tarifa}
                  onChange={(e) => setFormData({ ...formData, tarifa: e.target.value })}
                  decimalPlaces={2}
                  placeholder="Ingrese la tarifa"
                />
              </div>
              <div className="space-y-2">
                <br></br>
                <InputCheck
                  id="puestoPlanta"
                  checked={formData.puestoPlanta}
                  onChange={e => setFormData({ ...formData, puestoPlanta: e.target.checked })}
                  label="¿Es puesto de planta?"
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
                  {rate ? "Actualizando..." : "Creando..."}
                </>
              ) : rate ? (
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
