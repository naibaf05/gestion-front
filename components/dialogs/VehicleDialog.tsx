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
import { SelectSingle } from "../ui/select-single";

interface VehicleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    vehicle?: Vehicle | null;
    oficinas: Parametrizacion[];
    conductores: User[];
    tiposVehiculo: Parametrizacion[];
    onSuccess: () => void;
}

export function VehicleDialog({
    open,
    onOpenChange,
    vehicle,
    oficinas,
    conductores,
    tiposVehiculo,
    onSuccess,
}: VehicleDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        oficinaId: "",
        interno: "",
        placa: "",
        conductorId: "",
        datosJson: {} as any,
    });
    const { toast } = useToast();

    useEffect(() => {
        if (vehicle) {
            setFormData({
                oficinaId: vehicle.oficinaId,
                interno: vehicle.interno,
                placa: vehicle.placa,
                conductorId: vehicle.conductorId,
                datosJson: vehicle.datosJson || {},
            });
        } else {
            setFormData({
                oficinaId: "",
                interno: "",
                placa: "",
                conductorId: "",
                datosJson: {},
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
                                <SelectSingle
                                    id="planta"
                                    placeholder="Seleccione una planta"
                                    options={oficinas}
                                    value={formData.oficinaId}
                                    onChange={v => setFormData({ ...formData, oficinaId: v })}
                                    valueKey="id"
                                    labelKey="nombre"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tipoVehiculo">Tipo Vehículo *</Label>
                                <SelectSingle
                                    id="tipoVehiculo"
                                    placeholder="Seleccione un tipo de vehículo"
                                    options={tiposVehiculo}
                                    value={formData.datosJson.tipoVehiculoId}
                                    onChange={v => setFormData({ ...formData, datosJson: { ...formData.datosJson, tipoVehiculoId: v } })}
                                    valueKey="id"
                                    labelKey="nombre"
                                />
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
                                <SelectSingle
                                    id="conductor"
                                    placeholder="Seleccione un conductor"
                                    options={conductores}
                                    value={formData.conductorId}
                                    onChange={v => setFormData({ ...formData, conductorId: v })}
                                    valueKey="id"
                                    labelKey="nombreCompleto"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fechaSOAT">Fecha Vencimiento SOAT</Label>
                                <Input
                                    id="fechaSOAT"
                                    type="date"
                                    value={formData.datosJson.fechaSOAT}
                                    onChange={(e) => setFormData({ ...formData, datosJson: { ...formData.datosJson, fechaSOAT: e.target.value } })}
                                    autoComplete="off"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fechaTecnomecanica">Fecha Vencimiento Tecnomecánica</Label>
                                <Input
                                    id="fechaTecnomecanica"
                                    type="date"
                                    value={formData.datosJson.fechaTecnomecanica}
                                    onChange={(e) => setFormData({ ...formData, datosJson: { ...formData.datosJson, fechaTecnomecanica: e.target.value } })}
                                    autoComplete="off"
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
