"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Sede, Parametrizacion, VisitaRecol, Vehicle, User, ProgVisitaRecol } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { visitService } from "@/services/visitService"
import { SelectSingle } from "../ui/select-single"
import { Textarea } from "../ui/textarea"

interface VisitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: string;
  visitaId?: string | null
  visita?: VisitaRecol | null
  progVisitaRecol?: ProgVisitaRecol | null
  sedes: Sede[]
  vehiculos: Vehicle[]
  recolectores: User[]
  comerciales: Parametrizacion[]
  onSuccess: () => void
}

export function VisitDialog({
  open,
  onOpenChange,
  selectedDate,
  visitaId,
  visita,
  progVisitaRecol,
  sedes,
  vehiculos,
  recolectores,
  comerciales,
  onSuccess,
}: VisitDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    tipo: "",
    lat: "",
    lon: "",
    fecha: "",
    inicio: "",
    fin: "",
    notas: "",
    sedeId: "",
    recolId: "",
    vehId: "",
    comercialId: "",
    progVisitaRecolId: "",
  })
  const { toast } = useToast()

  interface LocationState { latitude: number | null; longitude: number | null; error: string | null; }

  const [location, setLocation] = useState<LocationState>({ latitude: null, longitude: null, error: null, });

  useEffect(() => {
    if (visita) {
      setFormData({
        tipo: visita.tipo,
        lat: visita.lat,
        lon: visita.lon,
        fecha: visita.fecha,
        inicio: visita.inicio,
        fin: visita.fin,
        notas: visita.notas || "",
        sedeId: visita.sedeId,
        recolId: visita.recolId,
        vehId: visita.vehId,
        comercialId: visita.comercialId,
        progVisitaRecolId: ""
      });
    } else {
      setFormData({
        tipo: "",
        lat: "",
        lon: "",
        fecha: selectedDate,
        inicio: "",
        fin: "",
        notas: "",
        sedeId: progVisitaRecol && progVisitaRecol.sedeId ? progVisitaRecol.sedeId : "",
        recolId: "",
        vehId: progVisitaRecol && progVisitaRecol.vehId ? progVisitaRecol.vehId : "",
        comercialId: "",
        progVisitaRecolId: ""
      })
    }
  }, [visita, open]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation((prev: any) => ({
        ...prev,
        error: "La geolocalización no es soportada por tu navegador.",
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
        });
      },
      (error) => {
        setLocation((prev: any) => ({
          ...prev,
          error: "Error obteniendo la localización: " + error.message,
        }));
      }
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (visitaId) {
        await visitService.update(visitaId, formData)
        toast({
          title: "Visita actualizada",
          description: "La visita ha sido actualizada exitosamente",
          variant: "success"
        })
      } else {
        if (progVisitaRecol) {
          formData.tipo = progVisitaRecol.tipo;
          formData.progVisitaRecolId = progVisitaRecol.id;
        } else {
          formData.tipo = "puesto";
          formData.progVisitaRecolId = "";
        }
        formData.lat = location.latitude + "";
        formData.lon = location.longitude + "";
        await visitService.create(formData)
        toast({
          title: "Visita creada",
          description: "La visita ha sido creada exitosamente",
          variant: "success"
        })
      }
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: progVisitaRecol ? "Error al actualizar la visita" : "Error al crear la visita",
        description: (error && error.message) ?
          error.message :
          progVisitaRecol
            ? "No se pudo actualizar la visita"
            : "No se pudo crear la visita",
        variant: "error",
      });
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{visitaId ? "Editar Visita" : "Nueva Visita"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha <span className="text-red-500">*</span></Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inicio">Inicio <span className="text-red-500">*</span></Label>
                <Input
                  id="inicio"
                  type="time"
                  value={formData.inicio}
                  onChange={(e) => setFormData({ ...formData, inicio: e.target.value })}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fin">Fin <span className="text-red-500">*</span></Label>
                <Input
                  id="fin"
                  type="time"
                  value={formData.fin}
                  onChange={(e) => setFormData({ ...formData, fin: e.target.value })}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sede">Sede <span className="text-red-500">*</span></Label>
                <SelectSingle
                  id="sede"
                  placeholder="Seleccione una sede"
                  options={sedes}
                  value={formData.sedeId}
                  onChange={v => setFormData({ ...formData, sedeId: v })}
                  valueKey="id"
                  labelKey="nombre"
                />
              </div>
              {progVisitaRecol && progVisitaRecol.id ?
                <div className="space-y-2">
                  <Label htmlFor="vehiculo">Vehículo <span className="text-red-500">*</span></Label>
                  <SelectSingle
                    id="vehiculo"
                    placeholder="Seleccione un vehículo"
                    options={vehiculos}
                    value={formData.vehId}
                    onChange={v => setFormData({ ...formData, vehId: v })}
                    valueKey="id"
                    labelKey="interno"
                  />
                </div> : ''}
              <div className="space-y-2">
                <Label htmlFor="recolector">Recolector <span className="text-red-500">*</span></Label>
                <SelectSingle
                  id="recolector"
                  placeholder="Seleccione un recolector"
                  options={recolectores}
                  value={formData.recolId}
                  onChange={v => setFormData({ ...formData, recolId: v })}
                  valueKey="id"
                  labelKey="nombreCompleto"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comercial">Comercial <span className="text-red-500">*</span></Label>
                <SelectSingle
                  id="comercial"
                  placeholder="Seleccione un comercial"
                  options={comerciales}
                  value={formData.comercialId}
                  onChange={v => setFormData({ ...formData, comercialId: v })}
                  valueKey="id"
                  labelKey="nombre"
                />
              </div>
            </div>
            <div className="grid gap-4">
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                rows={2}
                placeholder="..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary-hover">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {visitaId ? "Actualizando..." : "Creando..."}
                </>
              ) : visitaId ? (
                "Actualizar"
              ) : (
                "Crear"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog >
  )
}
