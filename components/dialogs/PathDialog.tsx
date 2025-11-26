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
import { SelectSingle } from "@/components/ui/select-single"
import { pathService } from "@/services/pathService"
import type { Path, Parametrizacion } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface PathDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ruta?: Path | null
  oficinas: Parametrizacion[]
  onSuccess: () => void
  readOnly?: boolean // modo solo lectura
}

const DIAS_SEMANA = [
  { value: "l", label: "Lunes" },
  { value: "m", label: "Martes" },
  { value: "x", label: "Miércoles" },
  { value: "j", label: "Jueves" },
  { value: "v", label: "Viernes" },
  { value: "s", label: "Sábado" },
  { value: "d", label: "Domingo" },
]

export function PathDialog({ open, onOpenChange, ruta, oficinas, onSuccess, readOnly = false }: PathDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    id: "",
    codigo: "",
    nombre: "",
    dia: "" as "" | "l" | "m" | "x" | "j" | "v" | "s" | "d",
    oficinaId: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    if (ruta) {
      setFormData({
        id: ruta.id,
        codigo: ruta.codigo,
        nombre: ruta.nombre,
        dia: ruta.dia,
        oficinaId: ruta.oficinaId,
      })
    } else {
      setFormData({
        id: "",
        codigo: "",
        nombre: "",
        dia: "",
        oficinaId: "",
      })
    }
  }, [ruta, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (ruta) {
        const result = await pathService.update(ruta.id, formData)
        toast({
          title: "Ruta actualizada",
          description: result.message ? result.message : "La ruta ha sido actualizada exitosamente",
          variant: "success",
        })
      } else {
        const result = await pathService.create(formData)
        toast({
          title: "Ruta creada",
          description: result.message ? result.message : "La ruta ha sido creada exitosamente",
          variant: "success",
        })
      }
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: ruta ? "No se pudo actualizar la ruta" : "No se pudo crear la ruta",
        description: error.message ? error.message : "Error inesperado",
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
          <DialogTitle>{ruta ? (readOnly ? "Detalle Ruta" : "Editar Ruta") : "Nueva Ruta"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo" required>Código</Label>
                <div className="flex gap-2">
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    required
                    placeholder="Código único de la ruta"
                    maxLength={200}
                    disabled={readOnly}
                    readOnly={readOnly}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre" required>Nombre</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  placeholder="Nombre descriptivo de la ruta"
                  maxLength={200}
                  disabled={readOnly}
                  readOnly={readOnly}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dia" required>Día de la Semana</Label>
                <SelectSingle
                  id="dia"
                  options={DIAS_SEMANA}
                  value={formData.dia}
                  onChange={(value) => setFormData({ ...formData, dia: value as any })}
                  valueKey="value"
                  labelKey="label"
                  placeholder="Selecciona un día"
                  disabled={readOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="oficina" required>Planta</Label>
                <SelectSingle
                  id="oficina"
                  options={oficinas.map(o => ({ id: String(o.id), nombre: o.nombre }))}
                  value={formData.oficinaId}
                  onChange={(value) => setFormData({ ...formData, oficinaId: value })}
                  valueKey="id"
                  labelKey="nombre"
                  placeholder="Selecciona una planta"
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
              <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary-hover">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {ruta ? "Actualizando..." : "Creando..."}
                  </>
                ) : ruta ? (
                  "Actualizar"
                ) : (
                  "Crear"
                )}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}