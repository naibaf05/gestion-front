"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parametrizationService } from "@/services/parametrizationService";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { ParametrizationType } from "@/types";
import { InputCheck } from "../ui/input-check";
import { InputDecimal } from "../ui/input-decimal";

interface ParametrizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: any | null;
  type: ParametrizationType;
  onSuccess: () => void;
}

export function ParametrizationDialog({
  open,
  onOpenChange,
  item,
  type,
  onSuccess,
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
      contenedores: "Contenedor",
      t_vehiculos: "Tipo de Vehículo"
    };
    return item ? `Editar ${titles[type]}` : `Nuevo ${titles[type]}`;
  };

  const getDescription = () => {
    const descriptions = {
      poblados: "municipio",
      oficinas: "planta",
      generadores: "generador",
      periodos: "periodo",
      comerciales: "comercial",
      t_residuos: "tipo de residuo",
      t_clientes: "tipo de cliente",
      und_medidas: "unidad de medida",
      contenedores: "contenedor",
      t_vehiculos: "tipo de vehículo"
    };
    return item
      ? `Modifica los datos del ${descriptions[type]}`
      : `Completa los datos para crear un nuevo ${descriptions[type]}`;
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
        nombre: "Nombre del contenedor",
        codigo: "Código del contenedor",
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
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código</Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase(), })}
                placeholder={placeholders.codigo}
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
                placeholder={placeholders.nombre}
              />
            </div>
            {type === 't_residuos' && (
              <div className="space-y-2">
                <InputCheck
                  id="esllanta"
                  checked={formData.datosJson?.esllanta}
                  onChange={(e) => setFormData({ ...formData, datosJson: { ...formData.datosJson, esllanta: e.target.checked } })}
                  label="¿Es Llanta?"
                />
              </div>
            )}
            {formData.datosJson?.esllanta && (
              <div className="space-y-2">
                <Label htmlFor="cantidad">Cantidad *</Label>
                <InputDecimal
                  id="cantidad"
                  value={formData.datosJson?.cantidad || ''}
                  onChange={(e) => setFormData({ ...formData, datosJson: { ...formData.datosJson, cantidad: e.target.value } })}
                  decimalPlaces={2}
                  placeholder="Ingrese una cantidad"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows={2}
                placeholder={placeholders.descripcion}
              />
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
                  {item ? "Actualizando..." : "Creando..."}
                </>
              ) : item ? (
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
