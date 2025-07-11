"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { vehicleService } from "@/services/vehicleService";
import type { Parametrizacion, User, Vehicle } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface VehicleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    vehicle?: Vehicle | null;
    oficinas: Parametrizacion[];
    conductores: User[];
    onSuccess: () => void;
}

export function VehicleDialog({
    open,
    onOpenChange,
    vehicle,
    oficinas,
    conductores,
    onSuccess,
}: VehicleDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        oficinaId: "",
        interno: "",
        placa: "",
        conductorId: "",
    });
    const { toast } = useToast();

    useEffect(() => {
        if (vehicle) {
            setFormData({
                oficinaId: vehicle.oficinaId,
                interno: vehicle.interno,
                placa: vehicle.placa,
                conductorId: vehicle.conductorId,
            });
        } else {
            setFormData({
                oficinaId: "",
                interno: "",
                placa: "",
                conductorId: "",
            });
        }
    }, [vehicle, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (vehicle) {
                await vehicleService.updateVehicle(vehicle.id, formData);
                toast({
                    title: "Vehículo actualizado",
                    description: "El vehículo ha sido actualizado exitosamente",
                });
            } else {
                await vehicleService.createVehicle(formData);
                toast({
                    title: "Vehículo creado",
                    description: "El vehículo ha sido creado exitosamente.",
                });
            }
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            toast({
                title: "Error",
                description: vehicle
                    ? "No se pudo actualizar el vehículo"
                    : "No se pudo crear el vehículo",
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
                    <DialogTitle>{vehicle ? "Editar Vehículo" : "Nuevo Vehículo"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="planta">Planta *</Label>
                                <Select
                                    value={formData.oficinaId ? String(formData.oficinaId) : ""}
                                    onValueChange={v => setFormData({ ...formData, oficinaId: v })}
                                    required
                                >
                                    <SelectTrigger id="planta">
                                        <SelectValue placeholder="Seleccione una planta" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {oficinas.map(oficina => (
                                            <SelectItem key={oficina.id} value={String(oficina.id)}>{oficina.nombre}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="interno">Interno *</Label>
                                <Input
                                    id="interno"
                                    value={formData.interno}
                                    onChange={e => setFormData({ ...formData, interno: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="placa">Placa *</Label>
                                <Input
                                    id="placa"
                                    value={formData.placa}
                                    onChange={e => setFormData({ ...formData, placa: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="conductor">Conductor *</Label>
                                <Select
                                    value={formData.conductorId ? String(formData.conductorId) : ""}
                                    onValueChange={v => setFormData({ ...formData, conductorId: v })}
                                    required
                                >
                                    <SelectTrigger id="conductor">
                                        <SelectValue placeholder="Seleccione un conductor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {conductores.map(user => (
                                            <SelectItem key={user.id} value={String(user.id)}>{user.nombre} {user.apellido}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
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
                                    {vehicle ? "Actualizando..." : "Creando..."}
                                </>
                            ) : vehicle ? (
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
