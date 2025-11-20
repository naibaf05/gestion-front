"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { alertService } from "@/services/alertService";
import type { AlertaVehiculo } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AlertaDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    alerta?: AlertaVehiculo | null;
    tipo: "soat" | "tecnomecanica";
    onSuccess: () => void;
}

export function AlertaDialog({
    open,
    onOpenChange,
    alerta,
    tipo,
    onSuccess,
}: AlertaDialogProps) {
    const [loading, setLoading] = useState(false);
    const [fecha, setFecha] = useState<string>("");
    const { toast } = useToast();

    useEffect(() => {
        if (alerta) {
            const fechaActual = tipo === "soat" ? alerta.fechaSoat : alerta.fechaTecnomecanica;
            if (fechaActual) {
                setFecha(fechaActual);
            }
        } else {
            setFecha("");
        }
    }, [alerta, tipo, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!fecha) {
            toast({
                title: "Error",
                description: "Debe seleccionar una fecha",
                variant: "destructive",
            });
            return;
        }

        if (!alerta?.id) {
            toast({
                title: "Error",
                description: "No se encontró el vehículo",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        try {
            if (tipo === "soat") {
                await alertService.updateFechaSoat(alerta.id, fecha);
            } else {
                await alertService.updateFechaTecnomecanica(alerta.id, fecha);
            }

            toast({
                title: "Éxito",
                description: `Fecha de ${tipo === "soat" ? "SOAT" : "Tecnomecánica"} actualizada correctamente`,
            });
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || `No se pudo actualizar la fecha de ${tipo === "soat" ? "SOAT" : "Tecnomecánica"}`,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        Actualizar Fecha de {tipo === "soat" ? "SOAT" : "Tecnomecánica"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Vehículo</Label>
                            <div className="text-sm text-muted-foreground">
                                <div><strong>Placa:</strong> {alerta?.placa}</div>
                                <div><strong>Conductor:</strong> {alerta?.conductorNombre}</div>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="fecha">
                                Fecha de {tipo === "soat" ? "SOAT" : "Tecnomecánica"}
                            </Label>
                            <Input
                                id="fecha"
                                type="date"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                                autoComplete="off"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
