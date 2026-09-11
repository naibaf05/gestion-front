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
import type { Parametrizacion, SalidaExterna, SalidaExternaCantidad, TipoResiduo } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { SelectSingle } from "../ui/select-single";
import { InputDecimal } from "../ui/input-decimal";
import { Input } from "../ui/input";
import { salidaExternaService } from "@/services/salidaExternaService";
import { InputPositiveInteger } from "../ui/input-positive-integer";
import { useAuth } from "@/contexts/AuthContext";
import { rateParamService } from "@/services/rateParamService";
import type { RateParam } from "@/types";

interface SalidaExternaCantidadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cantidad?: SalidaExternaCantidad | null;
  salidaExterna: SalidaExterna;
  contenedores: Parametrizacion[];
  tiposResiduos: TipoResiduo[];
  gestores?: Parametrizacion[];
  tiposTratamiento?: Parametrizacion[];
  onSuccess: () => void;
  readOnly?: boolean;
}

export function SalidaExternaCantidadDialog({
  open,
  onOpenChange,
  cantidad,
  salidaExterna,
  contenedores,
  tiposResiduos,
  gestores = [],
  tiposTratamiento = [],
  onSuccess,
  readOnly = false,
}: SalidaExternaCantidadDialogProps) {
  const { user } = useAuth();
  const [selectedTResiduo, setSelectedTResiduo] = useState<TipoResiduo | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewCantidadKg, setViewCantidadKg] = useState(false);
  const [disabledCantidad, setDisabledCantidad] = useState(false);
  const [formData, setFormData] = useState({
    cantidad: "",
    cantidadKg: "",
    id: "",
    tResiduoId: "",
    contenedorId: "",
    numContenedor: "",
    salidaExternaId: "",
    tarifaId: "",
    tarifaNombre: "",
    gestorId: "",
    tarifaGestorId: "",
    tarifaGestorNombre: "",
    tipoTratamientoId: "",
  });
  const { toast } = useToast();

  const isDateInRateRange = (fecha: string, rate: RateParam): boolean => {
    if (!fecha || !rate?.fechaInicio) return false;
    if (fecha < rate.fechaInicio) return false;
    if (rate.fechaFin && fecha > rate.fechaFin) return false;
    return true;
  };

  const findVigenteGestorRate = async (gestorId: string, fecha: string, sedeIds: string[]): Promise<RateParam | null> => {
    if (!gestorId || !fecha || sedeIds.length === 0) return null;
    const rates = (await rateParamService.getTableBySedes(sedeIds)).filter((rate) => String(rate.parametrizacionId) === String(gestorId));
    const vigentes = rates
      .filter((r) => r.activo && isDateInRateRange(fecha, r))
      .sort((a, b) => String(b.fechaInicio || "").localeCompare(String(a.fechaInicio || "")));
    return vigentes[0] || null;
  };

  useEffect(() => {
    if (!open) return;
    const sedeIds = [salidaExterna.sedeSalidaId, salidaExterna.sedeId].filter(Boolean) as string[];
    if (!formData.gestorId || !salidaExterna.fecha || sedeIds.length === 0) return;

    findVigenteGestorRate(formData.gestorId, salidaExterna.fecha, sedeIds)
      .then((rate) => {
        setFormData((prev) => ({
          ...prev,
          tarifaGestorId: rate?.id || "",
          tarifaGestorNombre: rate?.tarifaNombre || (prev.gestorId ? "Sin tarifa vigente" : ""),
        }));
      })
      .catch(() => {
        setFormData((prev) => ({
          ...prev,
          tarifaGestorId: "",
          tarifaGestorNombre: prev.gestorId ? "No se pudo consultar tarifa" : "",
        }));
      });
  }, [open, formData.gestorId, salidaExterna.sedeSalidaId, salidaExterna.sedeId, salidaExterna.fecha]);

  if (user && user.permisos && typeof user.permisos === "string") {
    user.permisos = JSON.parse(user.permisos);
  }

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permisos) return false;
    if (user.perfil?.nombre === "ADMIN") return true;
    return user.permisos[permission] === true;
  };

  useEffect(() => {
    if (cantidad) {
      const residuoSeleccionadoId = String(cantidad.tResiduoId ?? "");
      const residuoEncontrado = tiposResiduos.find((tr) => {
        const trId = String(tr.id ?? "");
        const trBaseId = trId.split("-")[0];
        return trId === residuoSeleccionadoId || trBaseId === residuoSeleccionadoId;
      });
      if (residuoEncontrado) {
        const cantidadT = residuoEncontrado.datosJson?.cantidad ? residuoEncontrado.datosJson?.cantidad : "";
        setDisabledCantidad(cantidadT !== "");
        setSelectedTResiduo(residuoEncontrado);
        setViewCantidadKg(residuoEncontrado.codigoUnidad === "M3");
      }
      setFormData({
        cantidad: cantidad.cantidad,
        cantidadKg: cantidad.cantidadKg || "",
        id: String(cantidad.tResiduoId ?? ""),
        tResiduoId: String(cantidad.tResiduoId ?? ""),
        contenedorId: cantidad.contenedorId || "",
        numContenedor: cantidad.numContenedor || "",
        salidaExternaId: cantidad.salidaExternaId,
        tarifaId: cantidad.tarifaId || "",
        tarifaNombre: cantidad.tarifaNombre || "",
        gestorId: cantidad.gestorId || "",
        tarifaGestorId: cantidad.tarifaGestorId || "",
        tarifaGestorNombre: cantidad.tarifaGestorNombre || "",
        tipoTratamientoId: cantidad.tipoTratamientoId || "",
      });
    } else {
      setFormData({
        cantidad: "",
        cantidadKg: "",
        id: "",
        tResiduoId: "",
        contenedorId: "",
        numContenedor: "",
        salidaExternaId: salidaExterna.id,
        tarifaId: "",
        tarifaNombre: "",
        gestorId: "",
        tarifaGestorId: "",
        tarifaGestorNombre: "",
        tipoTratamientoId: "",
      });
    }
  }, [cantidad, open, salidaExterna.id, tiposResiduos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (cantidad) {
        formData.id = "";
        await salidaExternaService.updateCantidad(cantidad.id, formData);
        toast({
          title: "Cantidad actualizada",
          description: "La cantidad ha sido actualizada exitosamente",
          variant: "success",
        });
      } else {
        formData.id = "";
        await salidaExternaService.createCantidad(formData);
        toast({
          title: "Cantidad agregada",
          description: "La cantidad ha sido agregada exitosamente",
          variant: "success",
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: cantidad ? "Error al actualizar" : "Error al crear",
        description: (error && error.message) ? error.message : "No se pudo guardar la cantidad",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTResiduoChange = async (v: string) => {
    const newFormData = { ...formData };
    newFormData.id = v;
    const residuoEncontrado = tiposResiduos.find((tr) => String(tr.id) === String(v));
    if (residuoEncontrado) {
      const split = String(residuoEncontrado.id).split("-");
      newFormData.tResiduoId = split[0];
      newFormData.cantidad = residuoEncontrado.datosJson?.cantidad ? residuoEncontrado.datosJson?.cantidad : "";
      newFormData.tarifaId = split.length > 1 ? split[1] : "";
      newFormData.tarifaNombre = residuoEncontrado.tarifaNombre;
      setDisabledCantidad(newFormData.cantidad !== "");
      setSelectedTResiduo(residuoEncontrado);
      const esM3 = residuoEncontrado.codigoUnidad === "M3";
      setViewCantidadKg(esM3);
      if (esM3 && residuoEncontrado.densidad && newFormData.cantidad) {
        newFormData.cantidadKg = (parseFloat(newFormData.cantidad) * parseFloat(residuoEncontrado.densidad)).toFixed(2);
      }
    } else {
      newFormData.tResiduoId = "";
      newFormData.cantidad = "";
      newFormData.tarifaId = "";
      newFormData.tarifaNombre = "";
      setDisabledCantidad(false);
      setSelectedTResiduo(null);
      setViewCantidadKg(false);
    }
    setFormData(newFormData);
  };

  const handleUnidadesChange = async (v: string) => {
    const newFormData = { ...formData };
    newFormData.numContenedor = v;
    if (selectedTResiduo?.datosJson?.cantidad && v) {
      newFormData.cantidad = (parseFloat(selectedTResiduo.datosJson?.cantidad) * parseInt(v)).toString();
    }
    if (viewCantidadKg && selectedTResiduo?.densidad && newFormData.cantidad) {
      newFormData.cantidadKg = (parseFloat(newFormData.cantidad) * parseFloat(selectedTResiduo.densidad)).toFixed(2);
    }
    setFormData(newFormData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{readOnly ? "Ver Cantidad" : (cantidad ? "Editar Cantidad" : "Nueva Cantidad")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="id" required>Tipo de Residuo</Label>
                <SelectSingle
                  id="id"
                  placeholder="Selecciona un tipo de residuo"
                  options={tiposResiduos}
                  value={formData.id}
                  onChange={handleTResiduoChange}
                  valueKey="id"
                  labelKey="nombreMostrar"
                  disabled={readOnly}
                />
              </div>
              {hasPermission("rates.view") && (
                <div className="space-y-2">
                  <Label htmlFor="tarifaNombre">Tarifa</Label>
                  <Input
                    id="tarifaNombre"
                    value={formData.tarifaNombre}
                    placeholder="Tarifa"
                    disabled={true}
                    readOnly={true}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="gestorId">Gestor</Label>
                <SelectSingle
                  id="gestorId"
                  placeholder="Selecciona un gestor (opcional)"
                  options={gestores}
                  value={formData.gestorId}
                  onChange={(value) => setFormData({ ...formData, gestorId: value, tarifaGestorId: "", tarifaGestorNombre: "" })}
                  valueKey="id"
                  labelKey="nombreMostrar"
                  disabled={readOnly}
                />
              </div>
              {hasPermission("rates.view") && (
                <div className="space-y-2">
                  <Label htmlFor="tarifaGestorNombre">Tarifa Gestor</Label>
                  <Input
                    id="tarifaGestorNombre"
                    value={formData.tarifaGestorNombre}
                    placeholder="Tarifa de gestor"
                    disabled={true}
                    readOnly={true}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="contenedorId">Unidad de Entrega</Label>
                <SelectSingle
                  id="contenedorId"
                  placeholder="Selecciona una unidad de entrega"
                  options={contenedores}
                  value={formData.contenedorId}
                  onChange={(value) => setFormData({ ...formData, contenedorId: value })}
                  valueKey="id"
                  labelKey="nombre"
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipoTratamientoId">Tipo de Tratamiento</Label>
                <SelectSingle
                  id="tipoTratamientoId"
                  placeholder="Selecciona un tipo de tratamiento (opcional)"
                  options={tiposTratamiento}
                  value={formData.tipoTratamientoId}
                  onChange={(value) => setFormData({ ...formData, tipoTratamientoId: value })}
                  valueKey="id"
                  labelKey="nombreMostrar"
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numContenedor">Unidades</Label>
                <InputPositiveInteger
                  value={formData.numContenedor}
                  onChange={(e) => handleUnidadesChange(e.target.value)}
                  disabled={readOnly}
                  readOnly={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cantidad" required>Cantidad (KG, M3, ...)</Label>
                <InputDecimal
                  id="cantidad"
                  value={formData.cantidad}
                  onChange={(e) => {
                    const newCantidad = e.target.value;
                    const densidad = selectedTResiduo?.densidad;
                    const cantKg = viewCantidadKg && densidad && newCantidad
                      ? parseFloat((parseFloat(newCantidad) * parseFloat(densidad)).toFixed(2)).toString()
                      : formData.cantidadKg;
                    setFormData({ ...formData, cantidad: newCantidad, cantidadKg: cantKg });
                  }}
                  required
                  decimalPlaces={2}
                  placeholder="Ingrese una cantidad"
                  disabled={disabledCantidad}
                  readOnly={disabledCantidad}
                />
              </div>
              {viewCantidadKg && (
                <div className="space-y-2">
                  <Label htmlFor="cantidadKg" required>Cantidad KG</Label>
                  <InputDecimal
                    id="cantidadKg"
                    value={formData.cantidadKg}
                    onChange={(e) => {
                      const newCantidadKg = e.target.value;
                      const densidad = selectedTResiduo?.densidad;
                      const cant = densidad && newCantidadKg
                        ? parseFloat((parseFloat(newCantidadKg) / parseFloat(densidad)).toFixed(2)).toString()
                        : formData.cantidad;
                      setFormData({ ...formData, cantidadKg: newCantidadKg, cantidad: cant });
                    }}
                    required
                    decimalPlaces={2}
                    placeholder="Ingrese una cantidad KG"
                    disabled={readOnly}
                    readOnly={readOnly}
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {readOnly ? "Cerrar" : "Cancelar"}
            </Button>
            {!readOnly && (
              <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary-hover">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {cantidad ? "Actualizando..." : "Creando..."}
                  </>
                ) : cantidad ? "Actualizar" : "Crear"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
