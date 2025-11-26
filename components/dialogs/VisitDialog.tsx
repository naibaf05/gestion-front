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
import { getTipoVisita } from "@/utils/utils"

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
  plantas: Parametrizacion[]
  onSuccess: () => void
  readOnly?: boolean
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
  plantas,
  onSuccess,
  readOnly = false,
}: VisitDialogProps) {
  const [loading, setLoading] = useState(false)
  const [selectedSede, setSelectedSede] = useState<Sede | null>(null)
  const [formData, setFormData] = useState({
    tipo: "",
    lat: "",
    lon: "",
    fecha: "",
    inicio: "",
    fin: "",
    notas: "",
    sedeId: "",
    plantaId: "",
    recolId: "",
    vehId: "",
    comercialId: "",
    progVisitaRecolId: "",
  })
  const { toast } = useToast()

  interface LocationState { latitude: number | null; longitude: number | null; error: string | null; }

  const [location, setLocation] = useState<LocationState>({ latitude: null, longitude: null, error: null, });

  const tipos = [
    { value: "puesto", label: getTipoVisita("puesto") },
    { value: "eventual", label: getTipoVisita("eventual") },
    { value: "ruta", label: getTipoVisita("ruta") },
  ];

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
        plantaId: visita.plantaId || "",
        recolId: visita.recolId,
        vehId: visita.vehId,
        comercialId: visita.comercialId,
        progVisitaRecolId: ""
      });
      const sede = sedes.find(s => s.id === visita.sedeId);
      if (sede) {
        setSelectedSede(sede);
      }
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
        plantaId: "",
        recolId: "",
        vehId: progVisitaRecol && progVisitaRecol.vehId ? progVisitaRecol.vehId : "",
        comercialId: "",
        progVisitaRecolId: ""
      })
      if (progVisitaRecol && progVisitaRecol.sedeId) {
        const sede = sedes.find(s => s.id === progVisitaRecol.sedeId);
        if (sede) {
          setSelectedSede(sede);
        }
      }
    }
  }, [visita, open]);

  useEffect(() => {
    if (selectedSede && selectedSede.oficinaId && selectedSede.oficinaId.length === 1) {
      setFormData(prev => ({
        ...prev,
        plantaId: selectedSede.oficinaId[0]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        plantaId: ""
      }));
    }
  }, [selectedSede]);

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
    if (readOnly) {
      onOpenChange(false)
      return
    }
    setLoading(true)

    try {
      if (visitaId) {
        const response = await visitService.update(visitaId, formData)
        toast({
          title: "Visita actualizada",
          description: response.message || "La visita ha sido actualizada exitosamente",
          variant: "success"
        })
      } else {
        if (progVisitaRecol) {
          formData.progVisitaRecolId = progVisitaRecol.id;
        } else {
          formData.progVisitaRecolId = "";
        }
        formData.lat = location.latitude + "";
        formData.lon = location.longitude + "";
        const response = await visitService.create(formData)
        toast({
          title: "Visita creada",
          description: response.message || "La visita ha sido creada exitosamente",
          variant: "success"
        })
      }
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: progVisitaRecol ? "Error al actualizar la visita" : "Error al crear la visita",
        description: error.message || "Error inesperado",
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
          <DialogTitle>{readOnly ? "Ver Visita" : (visitaId ? "Editar Visita" : "Nueva Visita")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha" required>Fecha</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  autoComplete="off"
                  disabled={readOnly}
                  readOnly={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inicio" required>Inicio</Label>
                <Input
                  id="inicio"
                  type="time"
                  value={formData.inicio}
                  onChange={(e) => setFormData({ ...formData, inicio: e.target.value })}
                  autoComplete="off"
                  disabled={readOnly}
                  readOnly={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fin">Fin</Label>
                <Input
                  id="fin"
                  type="time"
                  value={formData.fin}
                  onChange={(e) => setFormData({ ...formData, fin: e.target.value })}
                  autoComplete="off"
                  disabled={readOnly}
                  readOnly={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo" required>Tipo</Label>
                <SelectSingle
                  id="tipo"
                  placeholder="Seleccione un tipo"
                  options={tipos}
                  value={formData.tipo}
                  onChange={v => setFormData({ ...formData, tipo: v })}
                  valueKey="value"
                  labelKey="label"
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sede" required>Sede</Label>
                <SelectSingle
                  id="sede"
                  placeholder="Seleccione una sede"
                  options={sedes}
                  value={formData.sedeId}
                  onChange={v => {
                    setFormData({ ...formData, sedeId: v })
                    const sede = sedes.find(s => parseInt(s.id) === parseInt(v))
                    setSelectedSede(sede || null)
                  }}
                  valueKey="id"
                  labelKey="nombre"
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="planta">Planta</Label>
                <SelectSingle
                  id="planta"
                  placeholder="Seleccione una planta"
                  options={plantas}
                  value={formData.plantaId}
                  onChange={v => setFormData({ ...formData, plantaId: v })}
                  valueKey="id"
                  labelKey="nombre"
                  disabled={readOnly}
                />
              </div>
              {formData.tipo !== 'puesto' ?
                <div className="space-y-2">
                  <Label htmlFor="vehiculo">Vehículo</Label>
                  <SelectSingle
                    id="vehiculo"
                    placeholder="Seleccione un vehículo"
                    options={vehiculos}
                    value={formData.vehId}
                    onChange={v => setFormData({ ...formData, vehId: v })}
                    valueKey="id"
                    labelKey="interno"
                    disabled={readOnly}
                  />
                </div> : ''}
              <div className="space-y-2">
                <Label htmlFor="recolector" required>Recolector</Label>
                <SelectSingle
                  id="recolector"
                  placeholder="Seleccione un recolector"
                  options={recolectores}
                  value={formData.recolId}
                  onChange={v => setFormData({ ...formData, recolId: v })}
                  valueKey="id"
                  labelKey="nombreCompleto"
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comercial" required>Comercial</Label>
                <SelectSingle
                  id="comercial"
                  placeholder="Seleccione un comercial"
                  options={comerciales}
                  value={formData.comercialId}
                  onChange={v => setFormData({ ...formData, comercialId: v })}
                  valueKey="id"
                  labelKey="nombre"
                  disabled={readOnly}
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
                disabled={readOnly}
                readOnly={readOnly}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {readOnly ? 'Cerrar' : 'Cancelar'}
            </Button>
            {!readOnly && (
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
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog >
  )
}
