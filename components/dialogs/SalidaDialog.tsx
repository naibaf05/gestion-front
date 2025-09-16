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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { salidaService } from "@/services/salidaService"
import type { Salida, Sede, User, Parametrizacion } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { InputDecimal } from "@/components/ui/input-decimal"

interface SalidaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  salida?: Salida | null
  sedes: Sede[]
  conductores: User[]
  productos: Parametrizacion[]
  onSuccess: () => void
}

export function SalidaDialog({
  open,
  onOpenChange,
  salida,
  sedes,
  conductores,
  productos,
  onSuccess,
}: SalidaDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    sedeId: "",
    conductorId: "",
    productoId: "",
    peso: 0,
    fecha: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    if (salida) {
      setFormData({
        sedeId: salida.sedeId,
        conductorId: salida.conductorId,
        productoId: salida.productoId,
        peso: salida.peso,
        fecha: salida.fecha ? salida.fecha.split('T')[0] : "",
      })
    } else {
      // Fecha actual por defecto
      const today = new Date().toISOString().split('T')[0]
      setFormData({
        sedeId: "",
        conductorId: "",
        productoId: "",
        peso: 0,
        fecha: today,
      })
    }
  }, [salida, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
      <DialogContent className="sm:max-w-[500px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{salida ? "Editar Salida" : "Nueva Salida"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sede" required>Sede</Label>
              <Select
                required
                value={formData.sedeId ? String(formData.sedeId) : ""}
                onValueChange={(value) => setFormData({ ...formData, sedeId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una sede" />
                </SelectTrigger>
                <SelectContent>
                  {sedes.map((sede) => (
                    <SelectItem key={sede.id} value={String(sede.id)}>
                      {sede.nombre} - {sede.clienteNombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="conductor" required>Conductor</Label>
              <Select
                required
                value={formData.conductorId ? String(formData.conductorId) : ""}
                onValueChange={(value) => setFormData({ ...formData, conductorId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un conductor" />
                </SelectTrigger>
                <SelectContent>
                  {conductores.map((conductor) => (
                    <SelectItem key={conductor.id} value={String(conductor.id)}>
                      {conductor.nombreCompleto} - {conductor.documento}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="producto" required>Producto (Tipo de Residuo)</Label>
              <Select
                required
                value={formData.productoId ? String(formData.productoId) : ""}
                onValueChange={(value) => setFormData({ ...formData, productoId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo de residuo" />
                </SelectTrigger>
                <SelectContent>
                  {productos.map((producto) => (
                    <SelectItem key={producto.id} value={String(producto.id)}>
                      {producto.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha" required>Fecha</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {salida ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
