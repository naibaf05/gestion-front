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
import { salidaService } from "@/services/salidaService"
import type { Salida, Parametrizacion, Vehicle, Sede, User } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus } from "lucide-react"
import { InputDecimal } from "@/components/ui/input-decimal"
import { SelectSingle } from "../ui/select-single"
import { InputCheck } from "../ui/input-check"
import { VehicleManualDialog } from "./VehicleManualDialog"
import { Textarea } from "../ui/textarea"
import { rateParamService } from "@/services/rateParamService"
import type { RateParam } from "@/types"

interface SalidaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  salida?: Salida | null
  sedes: Sede[]
  vehiculos: Vehicle[]
  receptores: User[]
  productos: Parametrizacion[]
  plantas: Parametrizacion[]
  gestores: Parametrizacion[]
  fletes: Parametrizacion[]
  onSuccess: () => void
  onVehiclesUpdate?: () => void
  readOnly?: boolean
}

export function SalidaDialog({
  open,
  onOpenChange,
  salida,
  sedes,
  vehiculos,
  receptores,
  productos,
  plantas,
  gestores,
  fletes,
  onSuccess,
  onVehiclesUpdate,
  readOnly = false,
}: SalidaDialogProps) {
  const [loading, setLoading] = useState(false)
  const [openManualDialog, setOpenManualDialog] = useState(false)
  const [formData, setFormData] = useState({
    plantaId: "",
    plantaDestinoId: "",
    sedeId: "",
    sedeSalidaId: "",
    vehiculoId: "",
    receptorId: "",
    productoId: "",
    peso: 0,
    fecha: "",
    fechaRecibo: "",
    notas: "",
    esSede: false,
    esPlanta: false,
    gestorId: "",
    tarifaGestorId: "",
    tarifaGestorNombre: "",
    fleteId: "",
    tarifaFleteId: "",
    tarifaFleteNombre: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    if (salida) {
      setFormData({
        plantaId: salida.plantaId,
        plantaDestinoId: salida.plantaDestinoId || "",
        sedeId: salida.sedeId,
        sedeSalidaId: salida.sedeSalidaId || "",
        vehiculoId: salida.vehiculoId,
        receptorId: salida.receptorId || "",
        productoId: salida.productoId,
        peso: salida.peso,
        fecha: salida.fecha ? salida.fecha.split('T')[0] : "",
        fechaRecibo: salida.fechaRecibo ? salida.fechaRecibo.split('T')[0] : "",
        notas: salida.notas || "",
        esSede: salida.plantaId ? false : true,
        esPlanta: salida.sedeId ? false : true,
        gestorId: salida.gestorId || "",
        tarifaGestorId: salida.tarifaGestorId || "",
        tarifaGestorNombre: salida.tarifaGestorNombre || "",
        fleteId: salida.fleteId || "",
        tarifaFleteId: salida.tarifaFleteId || "",
        tarifaFleteNombre: salida.tarifaFleteNombre || "",
      })
    } else {
      // Fecha actual por defecto
      const today = new Date().toISOString().split('T')[0]
      setFormData({
        plantaId: "",
        plantaDestinoId: "",
        sedeId: "",
        sedeSalidaId: "",
        vehiculoId: "",
        receptorId: "",
        productoId: "",
        peso: 0,
        fecha: today,
        fechaRecibo: "",
        notas: "",
        esSede: false,
        esPlanta: false,
        gestorId: "",
        tarifaGestorId: "",
        tarifaGestorNombre: "",
        fleteId: "",
        tarifaFleteId: "",
        tarifaFleteNombre: "",
      })
    }
  }, [salida, open])

  // La sede que valida las tarifas de gestor/flete es la de salida si existe; si no, la de destino.
  const sedeTarifaId = formData.sedeSalidaId || formData.sedeId || ""

  const isDateInRateRange = (fecha: string, rate: RateParam): boolean => {
    if (!fecha || !rate?.fechaInicio) return false
    if (fecha < rate.fechaInicio) return false
    if (rate.fechaFin && fecha > rate.fechaFin) return false
    return true
  }

  const findVigenteFleteRate = async (fleteId: string, fecha: string, sedeId: string): Promise<RateParam | null> => {
    if (!fleteId || !fecha || !sedeId) return null
    const rates = (await rateParamService.getTableBySedes([sedeId])).filter((rate) =>
      String(rate.parametrizacionId) === String(fleteId)
    )
    const vigentes = rates
      .filter((r) => r.activo && isDateInRateRange(fecha, r))
      .sort((a, b) => String(b.fechaInicio || "").localeCompare(String(a.fechaInicio || "")))
    return vigentes[0] || null
  }

  const findVigenteGestorRate = async (gestorId: string, tResiduoId: string, fecha: string, sedeId: string): Promise<RateParam | null> => {
    if (!gestorId || !tResiduoId || !fecha || !sedeId) return null
    const rates = (await rateParamService.getTableBySedes([sedeId])).filter((rate) =>
      String(rate.parametrizacionId) === String(gestorId) &&
      String(rate.tipoResiduoId) === String(tResiduoId)
    )
    const vigentes = rates
      .filter((r) => r.activo && isDateInRateRange(fecha, r))
      .sort((a, b) => String(b.fechaInicio || "").localeCompare(String(a.fechaInicio || "")))
    return vigentes[0] || null
  }

  useEffect(() => {
    if (!open) return
    if (!formData.fleteId || !formData.fecha || !sedeTarifaId) {
      setFormData((prev) => ({
        ...prev,
        tarifaFleteId: "",
        tarifaFleteNombre: prev.fleteId ? "Selecciona sede y fecha" : "",
      }))
      return
    }
    findVigenteFleteRate(formData.fleteId, formData.fecha, sedeTarifaId)
      .then((rate) => {
        setFormData((prev) => ({
          ...prev,
          tarifaFleteId: rate?.id || "",
          tarifaFleteNombre: rate?.tarifaNombre || (prev.fleteId ? "Sin tarifa vigente" : ""),
        }))
      })
      .catch(() => {
        setFormData((prev) => ({
          ...prev,
          tarifaFleteId: "",
          tarifaFleteNombre: prev.fleteId ? "No se pudo consultar tarifa" : "",
        }))
      })
  }, [open, formData.fleteId, formData.fecha, sedeTarifaId])

  useEffect(() => {
    if (!open) return
    if (!formData.gestorId || !formData.productoId || !formData.fecha || !sedeTarifaId) {
      setFormData((prev) => ({
        ...prev,
        tarifaGestorId: "",
        tarifaGestorNombre: prev.gestorId ? "Selecciona un tipo de residuo" : "",
      }))
      return
    }
    findVigenteGestorRate(formData.gestorId, formData.productoId, formData.fecha, sedeTarifaId)
      .then((rate) => {
        setFormData((prev) => ({
          ...prev,
          tarifaGestorId: rate?.id || "",
          tarifaGestorNombre: rate?.tarifaNombre || (prev.gestorId ? "Sin tarifa vigente" : ""),
        }))
      })
      .catch(() => {
        setFormData((prev) => ({
          ...prev,
          tarifaGestorId: "",
          tarifaGestorNombre: prev.gestorId ? "No se pudo consultar tarifa" : "",
        }))
      })
  }, [open, formData.gestorId, formData.productoId, formData.fecha, sedeTarifaId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (readOnly) {
      onOpenChange(false)
      return
    }
    setLoading(true)

    try {
      if (salida) {
        await salidaService.updateSalida(salida.id, formData)
        toast({
          title: "Salida actualizada",
          description: "La salida ha sido actualizada exitosamente",
        })
      } else {
        await salidaService.createSalida(formData)
        toast({
          title: "Salida creada",
          description: "La salida ha sido creada exitosamente",
        })
      }
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: salida ? "No se pudo actualizar la salida" : "No se pudo crear la salida",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{readOnly ? "Ver Salida" : (salida ? "Editar Salida" : "Nueva Salida")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="planta" required>Salida</Label>
              <span style={{ paddingLeft: "15px" }}>
                <InputCheck
                  id="esSede"
                  checked={formData.esSede}
                  onChange={(e) => setFormData({ ...formData, esSede: e.target.checked })}
                  label="¿Es Sede?"
                />
              </span>
              {formData.esSede ? (
                <SelectSingle
                  id="sedeSalida"
                  placeholder="Selecciona una sede"
                  options={sedes}
                  value={formData.sedeSalidaId}
                  onChange={(value) => setFormData({ ...formData, sedeSalidaId: value })}
                  valueKey="id"
                  labelKey="nombre"
                  disabled={readOnly}
                />
              ) : (
                <SelectSingle
                  id="planta"
                  placeholder="Selecciona una planta"
                  options={plantas}
                  value={formData.plantaId}
                  onChange={(value) => setFormData({ ...formData, plantaId: value })}
                  valueKey="id"
                  labelKey="nombreMostrar"
                  disabled={readOnly}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cliente" required>Destino</Label>
              <span style={{ paddingLeft: "15px" }}>
                <InputCheck
                  id="esPlanta"
                  checked={formData.esPlanta}
                  onChange={(e) => setFormData({ ...formData, esPlanta: e.target.checked })}
                  label="¿Es Planta?"
                />
              </span>
              {formData.esPlanta ? (
                <SelectSingle
                  id="plantaDestino"
                  placeholder="Selecciona una planta"
                  options={plantas}
                  value={formData.plantaDestinoId}
                  onChange={(value) => setFormData({ ...formData, plantaDestinoId: value })}
                  valueKey="id"
                  labelKey="nombreMostrar"
                  disabled={readOnly}
                />
              ) : (
                <SelectSingle
                  id="sede"
                  placeholder="Selecciona una sede"
                  options={sedes}
                  value={formData.sedeId}
                  onChange={(value) => setFormData({ ...formData, sedeId: value })}
                  valueKey="id"
                  labelKey="nombre"
                  disabled={readOnly}
                />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="vehiculo" required>Vehículo</Label>
                {!readOnly && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setOpenManualDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Crear Manual
                  </Button>
                )}
              </div>
              <SelectSingle
                id="vehiculo"
                placeholder="Selecciona un vehículo"
                options={vehiculos}
                value={formData.vehiculoId}
                onChange={(value) => setFormData({ ...formData, vehiculoId: value })}
                valueKey="id"
                labelKey="labelConductor"
                disabled={readOnly}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="receptor">Receptor</Label>
                <SelectSingle
                  id="receptor"
                  placeholder="Selecciona un receptor"
                  options={receptores}
                  value={formData.receptorId}
                  onChange={(value) => setFormData({ ...formData, receptorId: value })}
                  valueKey="id"
                  labelKey="nombreCompleto"
                  disabled={readOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="producto" required>Producto (Tipo de Residuo)</Label>
                <SelectSingle
                  id="producto"
                  placeholder="Selecciona un tipo de residuo"
                  options={productos}
                  value={formData.productoId}
                  onChange={(value) => setFormData({ ...formData, productoId: value })}
                  valueKey="id"
                  labelKey="nombreMostrar"
                  disabled={readOnly}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="peso" required>Peso (kg)</Label>
                <InputDecimal
                  id="peso"
                  value={formData.peso.toString()}
                  onChange={(e) => setFormData({ ...formData, peso: parseFloat(e.target.value) || 0 })}
                  required
                  placeholder="0.00"
                  min={0}
                  step="0.01"
                  decimalPlaces={2}
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha" required>Fecha</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaRecibo">Fecha Recibo</Label>
                <Input
                  id="fechaRecibo"
                  type="date"
                  value={formData.fechaRecibo}
                  onChange={(e) => setFormData({ ...formData, fechaRecibo: e.target.value })}
                  disabled={readOnly}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gestor">Gestor</Label>
                <SelectSingle
                  id="gestor"
                  placeholder="Selecciona un gestor"
                  options={gestores}
                  value={formData.gestorId}
                  onChange={(value) => setFormData({ ...formData, gestorId: value, tarifaGestorId: "", tarifaGestorNombre: "" })}
                  valueKey="id"
                  labelKey="nombreMostrar"
                  disabled={readOnly}
                />
                {formData.gestorId && (
                  <p className="text-xs text-muted-foreground">Tarifa: {formData.tarifaGestorNombre || "Consultando..."}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="flete">Flete</Label>
                <SelectSingle
                  id="flete"
                  placeholder="Selecciona un flete"
                  options={fletes}
                  value={formData.fleteId}
                  onChange={(value) => setFormData({ ...formData, fleteId: value, tarifaFleteId: "", tarifaFleteNombre: "" })}
                  valueKey="id"
                  labelKey="nombreMostrar"
                  disabled={readOnly}
                />
                {formData.fleteId && (
                  <p className="text-xs text-muted-foreground">Tarifa: {formData.tarifaFleteNombre || "Consultando..."}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                rows={2}
                placeholder="..."
                disabled={readOnly}
                readOnly={readOnly}
                maxLength={500}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {readOnly ? "Cerrar" : "Cancelar"}
            </Button>
            {!readOnly && (
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {salida ? "Actualizar" : "Crear"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
      <VehicleManualDialog
        open={openManualDialog}
        onOpenChange={setOpenManualDialog}
        onSuccess={() => {
          if (onVehiclesUpdate) {
            onVehiclesUpdate()
          }
        }}
      />
    </Dialog>
  )
}
