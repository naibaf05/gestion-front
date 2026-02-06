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
  readOnly?: boolean;
}

export function RateDialog({
  open,
  onOpenChange,
  rate,
  sede,
  undMedidas,
  tiposResiduos = [],
  onSuccess,
  readOnly = false,
}: RateDialogProps) {
  const [loading, setLoading] = useState(false);
  const [viewDensidad, setViewDensidad] = useState(false);
  const [formData, setFormData] = useState({
    sedeId: "",
    undMedidaId: "",
    tipoResiduoId: "",
    tarifa: "",
    fechaInicio: "",
    fechaFin: "",
    puestoPlanta: false,
    densidad: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    if (rate) {
      const unidadEncontrada = undMedidas.find(un => parseInt(un.id) === parseInt(rate.undMedidaId));
      if (unidadEncontrada) {
        setViewDensidad(unidadEncontrada.codigo === 'M3');
        if (unidadEncontrada.codigo !== 'M3') {
          rate.densidad = "";
        }
      }
      setFormData({
        sedeId: sede ? sede.id : "",
        undMedidaId: rate.undMedidaId,
        tipoResiduoId: rate.tipoResiduoId,
        tarifa: rate.tarifa,
        fechaInicio: rate.fechaInicio,
        fechaFin: rate.fechaFin ?? "",
        puestoPlanta: rate.puestoPlanta ?? false,
        densidad: rate.densidad ?? "",
      });
    } else {
      setFormData({
        sedeId: sede ? sede.id : "",
        undMedidaId: "",
        tipoResiduoId: "",
        tarifa: "",
        fechaInicio: "",
        fechaFin: "",
        puestoPlanta: false,
        densidad: ""
      });
    }
  }, [rate, open]);

  const handleUnidadMedidaChange = async (v: string) => {
    const newFormData = { ...formData };
    const unidadEncontrada = undMedidas.find(un => parseInt(un.id) === parseInt(v));
    if (unidadEncontrada) {
      newFormData.undMedidaId = unidadEncontrada.id;
      setViewDensidad(unidadEncontrada.codigo === 'M3');
      if (unidadEncontrada.codigo !== 'M3') {
        newFormData.densidad = "";
      }
    }
    setFormData(newFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) {
      onOpenChange(false);
      return;
    }
    setLoading(true);

    try {
      console.log("Form Data to submit:", formData);
      if (rate) {
        const response = await rateService.update(rate.id, formData);
        toast({
          title: "Tarifa actualizada",
          description: response.message || "La tarifa ha sido actualizada exitosamente",
          variant: "success",
        });
      } else {
        const response = await rateService.create(formData);
        toast({
          title: "Tarifa creada",
          description: response.message || "La tarifa ha sido creada exitosamente",
          variant: "success",
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: rate ? "Error al actualizar la tarifa" : "Error al crear la tarifa",
        description: error.message || "Error inesperado",
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
          <DialogTitle>{readOnly ? "Ver Tarifa" : (rate ? "Editar Tarifa" : "Nueva Tarifa")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="undMedidaId" required>Unidad de Medida</Label>
                <SelectSingle
                  id="undMedidaId"
                  placeholder="Selecciona una unidad de medida"
                  options={undMedidas}
                  value={formData.undMedidaId}
                  onChange={handleUnidadMedidaChange}
                  valueKey="id"
                  labelKey="nombre"
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipoResiduoId" required>Tipo de Residuo</Label>
                <SelectSingle
                  id="tipoResiduoId"
                  placeholder="Selecciona un tipo de residuo"
                  options={tiposResiduos}
                  value={formData.tipoResiduoId}
                  onChange={(value) => setFormData({ ...formData, tipoResiduoId: value })}
                  valueKey="id"
                  labelKey="nombre"
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaInicio" required>Fecha Inicio</Label>
                <Input
                  id="fechaInicio"
                  type="date"
                  value={formData.fechaInicio}
                  onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                  disabled={readOnly}
                  readOnly={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaFin">Fecha Fin</Label>
                <Input
                  id="fechaFin"
                  type="date"
                  value={formData.fechaFin}
                  onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                  disabled={readOnly}
                  readOnly={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tarifa" required>Tarifa</Label>
                <InputDecimal
                  id="tarifa"
                  value={formData.tarifa}
                  onChange={(e) => setFormData({ ...formData, tarifa: e.target.value })}
                  decimalPlaces={2}
                  placeholder="Ingrese la tarifa"
                  disabled={readOnly}
                  readOnly={readOnly}
                />
              </div>
              {viewDensidad && (
                <div className="space-y-2">
                  <Label htmlFor="densidad">Densidad (kg/m3)</Label>
                  <InputDecimal
                    id="densidad"
                    value={formData.densidad}
                    onChange={(e) => setFormData({ ...formData, densidad: e.target.value })}
                    decimalPlaces={2}
                    placeholder="Ingrese la densidad"
                    disabled={readOnly}
                    readOnly={readOnly}
                  />
                </div>
              )}
              <div className="space-y-2">
                <br></br>
                <InputCheck
                  id="puestoPlanta"
                  checked={formData.puestoPlanta}
                  onChange={e => setFormData({ ...formData, puestoPlanta: e.target.checked })}
                  label="¿Es puesto de planta?"
                  disabled={readOnly}
                  readOnly={readOnly}
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
              {readOnly ? 'Cerrar' : 'Cancelar'}
            </Button>
            {!readOnly && (
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
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
