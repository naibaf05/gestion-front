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
import { userService } from "@/services/userService";
import type { Profile } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Textarea } from "../ui/textarea";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile?: Profile | null;
  onSuccess: () => void;
  readOnly?: boolean; // modo solo lectura
}

export function ProfileDialog({
  open,
  onOpenChange,
  profile,
  onSuccess,
  readOnly = false,
}: ProfileDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      setFormData({
        nombre: profile.nombre,
        descripcion: profile.descripcion,
      });
    } else {
      setFormData({
        nombre: "",
        descripcion: "",
      });
    }
  }, [profile, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (profile) {
        await userService.updateProfile(profile.id, formData);
        toast({
          title: "Perfil actualizado",
          description: "El perfil ha sido actualizado exitosamente",
          variant: "success",
        });
      } else {
        await userService.createProfile(formData);
        toast({
          title: "Perfil creado",
          description: "El perfil ha sido creado exitosamente.",
          variant: "success",
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: profile
          ? "No se pudo actualizar el perfil"
          : "No se pudo crear el perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{profile ? (readOnly ? "Detalle Perfil" : "Editar Perfil") : "Nuevo Perfil"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre" required>Nombre</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
                disabled={readOnly}
                readOnly={readOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion" required>Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows={3}
                required
                disabled={readOnly}
                readOnly={readOnly}
              />
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
                    {profile ? "Actualizando..." : "Creando..."}
                  </>
                ) : profile ? (
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
