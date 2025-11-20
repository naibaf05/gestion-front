"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parametrizationService } from "@/services/parametrizationService";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Cliente, ParametrizationType } from "@/types";
import { InputCheck } from "../ui/input-check";
import { InputDecimal } from "../ui/input-decimal";

interface ParametrizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: any | null;
  type: ParametrizationType;
  clientes: Cliente[];
  onSuccess: () => void;
  readOnly?: boolean;
}

export function ParametrizationDialog({
  open,
  onOpenChange,
  item,
  type,
  clientes,
  onSuccess,
  readOnly = false,
}: ParametrizationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    codigo: "",
    direccion: "",
    telefono: "",
    descripcion: "",
    datosJson: {} as any,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (item) {
      setFormData({
        nombre: item.nombre || "",
        codigo: item.codigo || "",
        direccion: item.direccion || "",
        telefono: item.telefono || "",
        descripcion: item.descripcion || "",
        datosJson: item.datosJson || {}
      });
    } else {
      setFormData({
        nombre: "",
        codigo: "",
        direccion: "",
        telefono: "",
        descripcion: "",
        datosJson: {}
      });
    }
  }, [item, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) {
      onOpenChange(false);
      return;
    }
    setLoading(true);

    try {
      const data: any = {
        nombre: formData.nombre,
        codigo: formData.codigo,
        descripcion: formData.descripcion,
      };

      if (item) {
        // Actualizar
        await parametrizationService.update(getStringType(type), item.id, formData);
        toast({
          title: "Elemento actualizado",
          description: "El elemento ha sido actualizado exitosamente",
          variant: "success",
        });
      } else {
        // Crear
        await parametrizationService.create(getStringType(type), formData);
        toast({
          title: "Elemento creado",
          description: "El elemento ha sido creado exitosamente",
          variant: "success",
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: item ? "Error al actualizar" : "Error al crear",
        description: (error && error.message) ?
          error.message :
          item
            ? "No se pudo actualizar el elemento"
            : "No se pudo crear el elemento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStringType = (type: ParametrizationType) => {
    switch (type) {
      case "poblados":
        return "poblado"
      case "oficinas":
        return "oficina"
      case "generadores":
        return "generador"
      case "periodos":
        return "periodo"
      case "comerciales":
        return "comercial"
      case "t_residuos":
        return "t_residuo"
      case "t_clientes":
        return "t_cliente"
      case "und_medidas":
        return "und_medida"
      case "contenedores":
        return "contenedor"
      case "t_vehiculos":
        return "t_vehiculo"
      default:
        return "";
    }
  }

  const getTitle = () => {
    const titles = {
      poblados: "Municipio",
      oficinas: "Planta",
      generadores: "Generador",
      periodos: "Periodo",
      comerciales: "Comercial",
      t_residuos: "Tipo de Residuo",
      t_clientes: "Tipo de Cliente",
      und_medidas: "Unidad de Medida",
      contenedores: "Unidad de Entrega",
      t_vehiculos: "Tipo de Vehículo"
    };
    if (readOnly) return `Ver ${titles[type]}`;
    return item ? `Editar ${titles[type]}` : `Nuevo ${titles[type]}`;
  };

  const getPlaceholders = () => {
    const placeholders = {
      poblados: {
        nombre: "Nombre del municipio",
        codigo: "Código del municipio (ej: MED)",
        descripcion: "Descripción",
      },
      oficinas: {
        nombre: "Nombre de la planta",
        codigo: "Código de la planta",
        descripcion: "Descripción",
      },
      generadores: {
        nombre: "Nombre del generador",
        codigo: "Código del generador",
        descripcion: "Descripción",
      },
      periodos: {
        nombre: "Nombre del periodo",
        codigo: "Código del periodo",
        descripcion: "Descripción",
      },
      comerciales: {
        nombre: "Nombre del comercial",
        codigo: "Código del comercial",
        descripcion: "Descripción",
      },
      t_residuos: {
        nombre: "Nombre del tipo de residuo",
        codigo: "Código del tipo de residuo",
        descripcion: "Descripción",
      },
      t_clientes: {
        nombre: "Nombre del tipo de cliente",
        codigo: "Código del tipo de cliente",
        descripcion: "Descripción",
      },
      und_medidas: {
        nombre: "Nombre de la unidad de medida",
        codigo: "Código de la unidad de medida",
        descripcion: "Descripción",
      },
      contenedores: {
        nombre: "Nombre de la unidad de entrega",
        codigo: "Código de la unidad de entrega",
        descripcion: "Descripción",
      },
      t_vehiculos: {
        nombre: "Nombre del tipo de vehículo",
        codigo: "Código del tipo de vehículo",
        descripcion: "Descripción",
      },
    };
    return placeholders[type];
  };

  const placeholders = getPlaceholders();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código</Label>
              {readOnly ? (
                <div className="text-sm text-muted-foreground min-h-[38px] border rounded-md px-3 py-2 bg-muted/50">{formData.codigo || '-'}</div>
              ) : (
                <Input
                  id="codigo"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase(), })}
                  placeholder={placeholders.codigo}
                  maxLength={10}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              {readOnly ? (
                <div className="text-sm text-muted-foreground min-h-[38px] border rounded-md px-3 py-2 bg-muted/50">{formData.nombre || '-'}</div>
              ) : (
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  placeholder={placeholders.nombre}
                />
              )}
            </div>
            {type === 't_residuos' && (
              <>
                <div className="space-y-2">
                  {readOnly ? (
                    <div className="flex items-center gap-2">
                      <Label className="font-medium">¿Es Llanta?</Label>
                      <span className="text-sm text-muted-foreground">{formData.datosJson?.esLlanta ? 'Sí' : 'No'}</span>
                    </div>
                  ) : (
                    <InputCheck
                      id="esLlanta"
                      checked={formData.datosJson?.esLlanta}
                      onChange={(e) => setFormData({ ...formData, datosJson: { ...formData.datosJson, esLlanta: e.target.checked } })}
                      label="¿Es Llanta?"
                    />
                  )}
                </div>
              </>
            )}
            {formData.datosJson?.esLlanta && (
              <div className="space-y-2">
                <Label htmlFor="cantidad">Cantidad (KGs) *</Label>
                {readOnly ? (
                  <div className="text-sm text-muted-foreground min-h-[38px] border rounded-md px-3 py-2 bg-muted/50">{formData.datosJson?.cantidad || '-'}</div>
                ) : (
                  <InputDecimal
                    id="cantidad"
                    value={formData.datosJson?.cantidad || ''}
                    onChange={(e) => setFormData({ ...formData, datosJson: { ...formData.datosJson, cantidad: e.target.value } })}
                    decimalPlaces={4}
                    placeholder="Ingrese una cantidad"
                  />
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              {readOnly ? (
                <div className="text-sm text-muted-foreground whitespace-pre-wrap min-h-[60px] border rounded-md px-3 py-2 bg-muted/50">{formData.descripcion || '-'}</div>
              ) : (
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={2}
                  placeholder={placeholders.descripcion}
                />
              )}
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
                    {item ? "Actualizando..." : "Creando..."}
                  </>
                ) : item ? (
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
