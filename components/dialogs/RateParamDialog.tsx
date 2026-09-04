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
import { rateParamService } from "@/services/rateParamService";
import type { RateParam, Parametrizacion, Sede } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { SelectSingle } from "../ui/select-single";
import { InputDecimal } from "../ui/input-decimal";
import { InputCheck } from "../ui/input-check";

interface RateParamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rate?: RateParam | null;
  parametrizacion?: Parametrizacion | null;
  undMedidas: Parametrizacion[];
  tiposResiduos?: Parametrizacion[];
  sedes?: Sede[];
  onSuccess: () => void;
  readOnly?: boolean;
}

export function RateParamDialog({
  open,
  onOpenChange,
  rate,
  parametrizacion,
  undMedidas,
  tiposResiduos = [],
  sedes = [],
  onSuccess,
  readOnly = false,
}: RateParamDialogProps) {
  const tipoParametrizacion = parametrizacion?.tipo?.toLowerCase();
  const esFlete = tipoParametrizacion === "flete" || tipoParametrizacion === "flete_focus";
  const [loading, setLoading] = useState(false);
  const [viewDensidad, setViewDensidad] = useState(false);
  const [formData, setFormData] = useState({
    parametrizacionId: "",
    sedeId: "",
    undMedidaId: "",
    tipoResiduoId: "",
    tarifa: "",
    fechaInicio: "",
    fechaFin: "",
    puestoPlanta: false,
    densidad: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (rate) {
      const unidadEncontrada = undMedidas.find(
        (un) => parseInt(un.id) === parseInt(rate.undMedidaId)
      );
      if (unidadEncontrada) {
        setViewDensidad(unidadEncontrada.codigo === "M3");
        if (unidadEncontrada.codigo !== "M3") {
          rate.densidad = "";
        }
      }
      setFormData({
        parametrizacionId: parametrizacion ? parametrizacion.id : "",
        sedeId: rate.sedeId ?? "",
        undMedidaId: rate.undMedidaId ?? "",
        tipoResiduoId: rate.tipoResiduoId ?? "",
        tarifa: rate.tarifa,
        fechaInicio: rate.fechaInicio,
        fechaFin: rate.fechaFin ?? "",
        puestoPlanta: rate.puestoPlanta ?? false,
        densidad: rate.densidad ?? "",
      });
    } else {
      setFormData({
        parametrizacionId: parametrizacion ? parametrizacion.id : "",
        sedeId: "",
        undMedidaId: "",
        tipoResiduoId: "",
        tarifa: "",
        fechaInicio: "",
        fechaFin: "",
        puestoPlanta: false,
        densidad: "",
      });
    }
  }, [rate, open]);

  const handleUnidadMedidaChange = (v: string) => {
    const newFormData = { ...formData };
    const unidadEncontrada = undMedidas.find(
      (un) => parseInt(un.id) === parseInt(v)
    );
    if (unidadEncontrada) {
      newFormData.undMedidaId = unidadEncontrada.id;
      setViewDensidad(unidadEncontrada.codigo === "M3");
      if (unidadEncontrada.codigo !== "M3") {
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
      if (rate) {
        const response = await rateParamService.update(rate.id, formData);
        toast({
          title: "Tarifa actualizada",
          description: response.message || "La tarifa ha sido actualizada exitosamente",
          variant: "success",
        });
      } else {
        const response = await rateParamService.create(formData);
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
          <DialogTitle>
            {readOnly ? "Ver Tarifa" : rate ? "Editar Tarifa" : "Nueva Tarifa"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              {esFlete && (
                <div className="space-y-2">
                  <Label htmlFor="sedeId" required>Sede</Label>
                  <SelectSingle
                    id="sedeId"
                    placeholder="Selecciona una sede"
                    options={sedes}
                    value={formData.sedeId}
                    onChange={(value) => setFormData({ ...formData, sedeId: value })}
                    valueKey="id"
                    labelKey="nombre"
                    disabled={readOnly}
                  />
                </div>
              )}
              {!esFlete && <div className="space-y-2">
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
              </div>}
              {!esFlete && <div className="space-y-2">
                <Label htmlFor="tipoResiduoId" required>Tipo de Residuo</Label>
                <SelectSingle
                  id="tipoResiduoId"
                  placeholder="Selecciona un tipo de residuo"
                  options={tiposResiduos}
                  value={formData.tipoResiduoId}
                  onChange={(value) =>
                    setFormData({ ...formData, tipoResiduoId: value })
                  }
                  valueKey="id"
                  labelKey="nombre"
                  disabled={readOnly}
                />
              </div>}
              <div className="space-y-2">
                <Label htmlFor="fechaInicio" required>Fecha Inicio</Label>
                <Input
                  id="fechaInicio"
                  type="date"
                  value={formData.fechaInicio}
                  onChange={(e) =>
                    setFormData({ ...formData, fechaInicio: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, fechaFin: e.target.value })
                  }
                  disabled={readOnly}
                  readOnly={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tarifa" required>Tarifa</Label>
                <InputDecimal
                  id="tarifa"
                  value={formData.tarifa}
                  onChange={(e) =>
                    setFormData({ ...formData, tarifa: e.target.value })
                  }
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
                    onChange={(e) =>
                      setFormData({ ...formData, densidad: e.target.value })
                    }
                    decimalPlaces={2}
                    placeholder="Ingrese la densidad"
                    disabled={readOnly}
                    readOnly={readOnly}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="puestoPlanta">Puesto en Planta</Label>
                <InputCheck
                  id="puestoPlanta"
                  checked={formData.puestoPlanta}
                  onChange={(e) =>
                    setFormData({ ...formData, puestoPlanta: e.target.checked })
                  }
                  disabled={readOnly}
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
              {readOnly ? "Cerrar" : "Cancelar"}
            </Button>
            {!readOnly && (
              <Button
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-primary-hover"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {rate ? "Actualizar" : "Crear"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
