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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Parametrizacion, Sede, Vehicle } from "@/types";
import { SelectSingle } from "../ui/select-single";
import { progService } from "@/services/progService";

interface RutaEventualDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehiculos: Vehicle[];
  sedes: Sede[];
  oficinas: Parametrizacion[];
  selectedDate: string;
  onSuccess: () => void;
}

export function RutaEventualDialog({
  open,
  onOpenChange,
  vehiculos,
  sedes,
  oficinas,
  selectedDate,
  onSuccess,
}: RutaEventualDialogProps) {
  const [loading, setLoading] = useState(false);
  const [fecha, setFecha] = useState(selectedDate);
  const [nombre, setNombre] = useState("");
  const [vehiculoId, setVehiculoId] = useState("");
  const [oficinaId, setOficinaId] = useState("");
  const [sedeIdToAdd, setSedeIdToAdd] = useState("");
  const [sedeIds, setSedeIds] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setFecha(selectedDate);
    setNombre("");
    setVehiculoId("");
    setOficinaId("");
    setSedeIdToAdd("");
    setSedeIds([]);
  }, [open, selectedDate]);

  const handleAgregarSede = () => {
    if (!sedeIdToAdd) return;
    if (sedeIds.includes(sedeIdToAdd)) {
      toast({ title: "Sede repetida", description: "Esa sede ya fue agregada a la ruta", variant: "warning" });
      return;
    }
    setSedeIds([...sedeIds, sedeIdToAdd]);
    setSedeIdToAdd("");
  };

  const handleQuitarSede = (sedeId: string) => {
    setSedeIds(sedeIds.filter(id => id !== sedeId));
  };

  const moverSede = (index: number, direccion: -1 | 1) => {
    const nuevoIndex = index + direccion;
    if (nuevoIndex < 0 || nuevoIndex >= sedeIds.length) return;
    const nuevaLista = [...sedeIds];
    [nuevaLista[index], nuevaLista[nuevoIndex]] = [nuevaLista[nuevoIndex], nuevaLista[index]];
    setSedeIds(nuevaLista);
  };

  const nombreSede = (sedeId: string) => sedes.find(s => String(s.id) === String(sedeId))?.nombre || sedeId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fecha) {
      toast({ title: "Falta la fecha", description: "Selecciona el día en que se hará la ruta eventual", variant: "warning" });
      return;
    }
    if (!nombre.trim()) {
      toast({ title: "Falta el nombre", description: "Ingresa un nombre para la ruta eventual", variant: "warning" });
      return;
    }
    if (!vehiculoId) {
      toast({ title: "Falta el vehículo", description: "Selecciona el vehículo que hará la ruta", variant: "warning" });
      return;
    }
    if (!oficinaId) {
      toast({ title: "Falta la planta", description: "Selecciona la planta/oficina de la ruta", variant: "warning" });
      return;
    }
    if (sedeIds.length === 0) {
      toast({ title: "Faltan sedes", description: "Agrega al menos una sede a la ruta", variant: "warning" });
      return;
    }

    setLoading(true);
    try {
      await progService.createRutaEventual({
        fecha,
        nombre: nombre.trim(),
        vehiculoId,
        oficinaId,
        sedeIds,
      });
      toast({
        title: "Creada",
        description: "La ruta eventual ha sido creada exitosamente",
        variant: "success",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error Creación",
        description: (error && error.message) ? error.message : "No se pudo crear la ruta eventual",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] max-h-[95vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Nueva Ruta Eventual</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="grid gap-4 py-4 shrink-0">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha" required>Fecha</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nombre" required>Nombre de la ruta</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Ruta eventual zona norte"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehiculoId" required>Vehículo</Label>
                <SelectSingle
                  id="vehiculoId"
                  placeholder="Seleccione un vehículo"
                  options={vehiculos}
                  value={vehiculoId}
                  onChange={setVehiculoId}
                  valueKey="id"
                  labelKey="interno"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="oficinaId" required>Planta</Label>
                <SelectSingle
                  id="oficinaId"
                  placeholder="Seleccione una planta"
                  options={oficinas}
                  value={oficinaId}
                  onChange={setOficinaId}
                  valueKey="id"
                  labelKey="nombre"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sedes a visitar</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <SelectSingle
                    id="sedeIdToAdd"
                    placeholder="Seleccione una sede"
                    options={sedes}
                    value={sedeIdToAdd}
                    onChange={setSedeIdToAdd}
                    valueKey="id"
                    labelKey="nombre"
                  />
                </div>
                <Button type="button" onClick={handleAgregarSede} className="bg-primary hover:bg-primary-hover">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto border rounded-md">
            {sedeIds.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aún no has agregado sedes</p>
            ) : (
              <ul className="divide-y">
                {sedeIds.map((sedeId, index) => (
                  <li key={sedeId} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span>{index + 1}. {nombreSede(sedeId)}</span>
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="ghost" size="sm" onClick={() => moverSede(index, -1)} disabled={index === 0}>
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => moverSede(index, 1)} disabled={index === sedeIds.length - 1}>
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleQuitarSede(sedeId)} className="new-text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <DialogFooter className="shrink-0 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary-hover">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
