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
      // Establecer la sede seleccionada si existe
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
      // Establecer la sede seleccionada si viene de progVisitaRecol
      if (progVisitaRecol && progVisitaRecol.sedeId) {
        const sede = sedes.find(s => s.id === progVisitaRecol.sedeId);
        if (sede) {
          setSelectedSede(sede);
        }
      }
    }
  }, [visita, open]);

  // Efecto para establecer automáticamente la planta si la sede solo tiene una oficina
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
        await visitService.update(visitaId, formData)
        toast({
          title: "Visita actualizada",
          description: "La visita ha sido actualizada exitosamente",
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
          <DialogTitle>{readOnly ? "Ver Visita" : (visitaId ? "Editar Visita" : "Nueva Visita")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha" required>Fecha</Label>
                {readOnly ? (
                  <div className="text-sm py-2 px-3 rounded border bg-muted/30">{formData.fecha || '-'}</div>
                ) : (
                  <Input
                    id="fecha"
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    autoComplete="off"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="inicio" required>Inicio</Label>
                {readOnly ? (
                  <div className="text-sm py-2 px-3 rounded border bg-muted/30">{formData.inicio || '-'}</div>
                ) : (
                  <Input
                    id="inicio"
                    type="time"
                    value={formData.inicio}
                    onChange={(e) => setFormData({ ...formData, inicio: e.target.value })}
                    autoComplete="off"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fin">Fin</Label>
                {readOnly ? (
                  <div className="text-sm py-2 px-3 rounded border bg-muted/30">{formData.fin || '-'}</div>
                ) : (
                  <Input
                    id="fin"
                    type="time"
                    value={formData.fin}
                    onChange={(e) => setFormData({ ...formData, fin: e.target.value })}
                    autoComplete="off"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo" required>Tipo</Label>
                {readOnly ? (
                  <div className="text-sm py-2 px-3 rounded border bg-muted/30">{tipos.find(t=>t.value===formData.tipo)?.label || '-'}</div>
                ) : (
                  <SelectSingle
                    id="tipo"
                    placeholder="Seleccione un tipo"
                    options={tipos}
                    value={formData.tipo}
                    onChange={v => setFormData({ ...formData, tipo: v })}
                    valueKey="value"
                    labelKey="label"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sede" required>Sede</Label>
                {readOnly ? (
                  <div className="text-sm py-2 px-3 rounded border bg-muted/30">{sedes.find(s=>String(s.id)===String(formData.sedeId))?.nombre || '-'}</div>
                ) : (
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
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="planta">Planta</Label>
                {readOnly ? (
                  <div className="text-sm py-2 px-3 rounded border bg-muted/30">{plantas.find(p=>String(p.id)===String(formData.plantaId))?.nombre || '-'}</div>
                ) : (
                  <SelectSingle
                    id="planta"
                    placeholder="Seleccione una planta"
                    options={plantas}
                    value={formData.plantaId}
                    onChange={v => setFormData({ ...formData, plantaId: v })}
                    valueKey="id"
                    labelKey="nombre"
                  />
                )}
              </div>
              {formData.tipo !== 'puesto' ?
                <div className="space-y-2">
                  <Label htmlFor="vehiculo">Vehículo</Label>
                  {readOnly ? (
                    <div className="text-sm py-2 px-3 rounded border bg-muted/30">{vehiculos.find(v=>String(v.id)===String(formData.vehId))?.interno || '-'}</div>
                  ) : (
                    <SelectSingle
                      id="vehiculo"
                      placeholder="Seleccione un vehículo"
                      options={vehiculos}
                      value={formData.vehId}
                      onChange={v => setFormData({ ...formData, vehId: v })}
                      valueKey="id"
                      labelKey="interno"
                    />
                  )}
                </div> : ''}
              <div className="space-y-2">
                <Label htmlFor="recolector" required>Recolector</Label>
                {readOnly ? (
                  <div className="text-sm py-2 px-3 rounded border bg-muted/30">{recolectores.find(r=>String(r.id)===String(formData.recolId))?.nombreCompleto || '-'}</div>
                ) : (
                  <SelectSingle
                    id="recolector"
                    placeholder="Seleccione un recolector"
                    options={recolectores}
                    value={formData.recolId}
                    onChange={v => setFormData({ ...formData, recolId: v })}
                    valueKey="id"
                    labelKey="nombreCompleto"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="comercial" required>Comercial</Label>
                {readOnly ? (
                  <div className="text-sm py-2 px-3 rounded border bg-muted/30">{comerciales.find(c=>String(c.id)===String(formData.comercialId))?.nombre || '-'}</div>
                ) : (
                  <SelectSingle
                    id="comercial"
                    placeholder="Seleccione un comercial"
                    options={comerciales}
                    value={formData.comercialId}
                    onChange={v => setFormData({ ...formData, comercialId: v })}
                    valueKey="id"
                    labelKey="nombre"
                  />
                )}
              </div>
            </div>
            <div className="grid gap-4">
              <Label htmlFor="notas">Notas</Label>
              {readOnly ? (
                <div className="text-sm py-2 px-3 rounded border bg-muted/30 whitespace-pre-wrap">{formData.notas || '-'}</div>
              ) : (
                <Textarea
                  id="notas"
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows={2}
                  placeholder="..."
                />
              )}
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
