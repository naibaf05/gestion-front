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
import { SelectSingle } from "../ui/select-single";
import { userService } from "@/services/userService";
import type { User, Profile } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { SelectMultiple } from "../ui/select-multiple";

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  profiles: Profile[];
  onSuccess: () => void;
  readOnly?: boolean;
}

export function UserDialog({
  open,
  onOpenChange,
  user,
  profiles,
  onSuccess,
  readOnly = false,
}: UserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    documento: "",
    telefono: "",
    email: "",
    rolId: [] as string[],
    username: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre,
        apellido: user.apellido,
        documento: user.documento,
        telefono: user.telefono,
        email: user.email,
        rolId: user.rolId || [],
        username: user.username,
      });
    } else {
      setFormData({
        nombre: "",
        apellido: "",
        documento: "",
        telefono: "",
        email: "",
        rolId: [],
        username: "",
      });
    }
  }, [user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (user) {
        const resp = await userService.updateUser(user.id, formData);
        toast({
          title: "Usuario actualizado",
          description: resp?.message || "El usuario ha sido actualizado exitosamente",
          variant: "success",
        });
      } else {
        const resp = await userService.createUser(formData);
        toast({
          title: "Usuario creado",
          description: resp?.message || "El usuario ha sido creado exitosamente, recuerde que su contraseña inicial es su numero de documento",
          variant: "success",
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: user ? "No se pudo actualizar el usuario" : "No se pudo crear el usuario",
        description: error.message
          ? error.message
          : "Error inesperado",
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
          <DialogTitle>{user ? (readOnly ? "Detalle Usuario" : "Editar Usuario") : "Nuevo Usuario"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre" required>Nombre</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  required
                  disabled={readOnly}
                  readOnly={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido" required>Apellido</Label>
                <Input
                  id="apellido"
                  value={formData.apellido}
                  onChange={(e) =>
                    setFormData({ ...formData, apellido: e.target.value })
                  }
                  required
                  disabled={readOnly}
                  readOnly={readOnly}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="documento" required>Documento</Label>
                <Input
                  id="documento"
                  value={formData.documento}
                  onChange={(e) =>
                    setFormData({ ...formData, documento: e.target.value })
                  }
                  required
                  disabled={readOnly}
                  readOnly={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono" required>Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                  required
                  disabled={readOnly}
                  readOnly={readOnly}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username" required>Usuario</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                  disabled={readOnly}
                  readOnly={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="perfil" required>Perfil</Label>
                <SelectMultiple
                  options={profiles.map(tc => ({ value: tc.id, label: tc.nombre }))}
                  value={formData.rolId}
                  onChange={selected => setFormData({ ...formData, rolId: selected })}
                  placeholder="Selecciona perfiles"
                  disabled={readOnly}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" required>Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                disabled={readOnly}
                readOnly={readOnly}
              />
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
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {user ? "Actualizando..." : "Creando..."}
                  </>
                ) : user ? (
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
