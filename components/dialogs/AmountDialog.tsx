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
import type { Rate, Parametrizacion, VisitaCantidad, VisitaRecol, TipoResiduo } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { SelectSingle } from "../ui/select-single";
import { InputDecimal } from "../ui/input-decimal";
import { Input } from "../ui/input";
import { visitService } from "@/services/visitService";
import { InputPositiveInteger } from "../ui/input-positive-integer";
import { rateService } from "@/services/rateService";
import { useAuth } from "@/contexts/AuthContext";

interface AmountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progVisitaRecolId?: string | null;
  cantidad?: VisitaCantidad | null;
  visitaRecol: VisitaRecol;
  contenedores: Parametrizacion[];
  tiposResiduos: TipoResiduo[];
  onSuccess: () => void;
}

export function AmountDialog({
  open,
  onOpenChange,
  progVisitaRecolId,
  cantidad,
  visitaRecol,
  contenedores,
  tiposResiduos,
  onSuccess,
}: AmountDialogProps) {
  const { user, logout } = useAuth()
  const [selectedTResiduo, setSelectedTResiduo] = useState<Parametrizacion | null>(null)
  const [loading, setLoading] = useState(false);
  const [viewCantidadKg, setViewCantidadKg] = useState(false);
  const [formData, setFormData] = useState({
    cantidad: "",
    cantidadKg: "",
    id: "",
    tResiduoId: "",
    contenedorId: "",
    numContenedor: "",
    visitaRecolId: "",
    tarifaId: "",
    tarifaNombre: ""
  });
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
    if (cantidad) {
      setFormData({
        cantidad: cantidad.cantidad,
        cantidadKg: cantidad.cantidadKg || "",
        id: cantidad.id,
        tResiduoId: cantidad.tResiduoId,
        contenedorId: cantidad.contenedorId,
        numContenedor: cantidad.numContenedor,
        visitaRecolId: cantidad.visitaRecolId,
        tarifaId: cantidad.tarifaId,
        tarifaNombre: cantidad.tarifaNombre || ''
      });
    } else {
      setFormData({
        cantidad: "",
        cantidadKg: "",
        id: "",
        tResiduoId: "",
        contenedorId: "",
        numContenedor: "",
        visitaRecolId: visitaRecol.id,
        tarifaId: "",
        tarifaNombre: ""
      });
    }
  }, [cantidad, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (cantidad) {
        formData.id = "";
        await visitService.updateCantidad(cantidad.id, formData);
        toast({
          title: "Cantidad actualizada",
          description: "La cantidad ha sido actualizada exitosamente",
          variant: "success",
        });
      } else {
        formData.id = "";
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

  const handleTResiduoChange = async (v: string) => {
    formData.id = v;
    const residuoEncontrado = tiposResiduos.find(tr => tr.id === v);
    console.log(residuoEncontrado);
    if (residuoEncontrado) {
      formData.tResiduoId = residuoEncontrado.id.split('-')[0];
      formData.cantidad = (residuoEncontrado.datosJson?.cantidad ? residuoEncontrado.datosJson?.cantidad : '');
      formData.tarifaId = residuoEncontrado.id.split('-')[1];
      formData.tarifaNombre = residuoEncontrado.tarifaNombre;
      setSelectedTResiduo(residuoEncontrado);
      setViewCantidadKg(residuoEncontrado.codigoUnidad === 'M3');
    } else {
      formData.tResiduoId = '';
      formData.cantidad = '';
      formData.tarifaId = '';
      formData.tarifaNombre = '';
      setSelectedTResiduo(null);
      setViewCantidadKg(false);
    }
    setFormData(formData);
  };

  const handleUnidadChange = async (value: string) => {
    formData.numContenedor = value;
    if (selectedTResiduo?.datosJson?.cantidad) {
      const cantidad = selectedTResiduo.datosJson?.cantidad;
      const cantidadTotal = parseFloat(cantidad) * parseInt(value);
      formData.cantidad = cantidadTotal.toString();
    }
    setFormData(formData);
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
                <Label htmlFor="id" required>Tipo de Residuo</Label>
                <SelectSingle
                  id="id"
                  placeholder="Selecciona un tipo de residuo"
                  options={tiposResiduos}
                  value={formData.id}
                  onChange={handleTResiduoChange}
                  valueKey="id"
                  labelKey="nombreMostrar"
                />
              </div>
              {hasPermission("rates.view") && (
                <div className="space-y-2">
                  <Label htmlFor="tarifaId">Tarifa</Label>
                  <Input
                    id="tarifaNombre"
                    value={formData.tarifaNombre}
                    placeholder="Tarifa"
                    disabled={true}
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numContenedor">Unidades</Label>
                <InputPositiveInteger
                  value={formData.numContenedor}
                  onChange={(e) => setFormData({ ...formData, numContenedor: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cantidad" required>Cantidad (KG, M3, ...)</Label>
                <InputDecimal
                  id="cantidad"
                  value={formData.cantidad}
                  onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                  decimalPlaces={4}
                  placeholder="Ingrese una cantidad"
                />
              </div>
              {viewCantidadKg && (
                <div className="space-y-2">
                  <Label htmlFor="cantidadKg" required>Cantidad KG</Label>
                  <InputDecimal
                    id="cantidadKg"
                    value={formData.cantidadKg}
                    onChange={(e) => setFormData({ ...formData, cantidadKg: e.target.value })}
                    decimalPlaces={4}
                    placeholder="Ingrese una cantidad KG"
                  />
                </div>
              )}
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
