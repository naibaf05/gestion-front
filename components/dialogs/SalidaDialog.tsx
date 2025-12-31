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
import type { Salida, Parametrizacion, Vehicle, Sede } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { InputDecimal } from "@/components/ui/input-decimal"
import { SelectSingle } from "../ui/select-single"
import { InputCheck } from "../ui/input-check"

interface SalidaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  salida?: Salida | null
  sedes: Sede[]
  vehiculos: Vehicle[]
  productos: Parametrizacion[]
  plantas: Parametrizacion[]
  onSuccess: () => void
  readOnly?: boolean
}

export function SalidaDialog({
  open,
  onOpenChange,
  salida,
  sedes,
  vehiculos,
  productos,
  plantas,
  onSuccess,
  readOnly = false,
}: SalidaDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    plantaId: "",
    plantaDestinoId: "",
    sedeId: "",
    sedeSalidaId: "",
    vehiculoId: "",
    productoId: "",
    peso: 0,
    fecha: "",
    esSede: false,
    esPlanta: false,
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
        productoId: salida.productoId,
        peso: salida.peso,
        fecha: salida.fecha ? salida.fecha.split('T')[0] : "",
        esSede: salida.plantaId ? false : true,
        esPlanta: salida.sedeId ? false : true,
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
        productoId: "",
        peso: 0,
        fecha: today,
        esSede: false,
        esPlanta: false,
      })
    }
  }, [salida, open])

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
              <Label htmlFor="vehiculo" required>Vehículo</Label>
              <SelectSingle
                id="vehiculo"
                placeholder="Selecciona un vehículo"
                options={vehiculos}
                value={formData.vehiculoId}
                onChange={(value) => setFormData({ ...formData, vehiculoId: value })}
                valueKey="id"
                labelKey="placa"
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
    </Dialog>
  )
}
