"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { pathService } from "@/services/pathService"
import type { Path, Parametrizacion } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Calendar } from "lucide-react"

interface PathDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ruta?: Path | null
  oficinas: Parametrizacion[]
  tiposResiduo: Parametrizacion[]
  onSuccess: () => void
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

export function PathDialog({ open, onOpenChange, ruta, oficinas, tiposResiduo, onSuccess }: PathDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    id: "",
    codigo: "",
    nombre: "",
    dia: "" as "" | "l" | "m" | "x" | "j" | "v" | "s" | "d",
    oficinaId: "",
    tResiduoId: "",
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
        tResiduoId: ruta.tResiduoId,
      })
    } else {
      setFormData({
        id: "",
        codigo: "",
        nombre: "",
        dia: "",
        oficinaId: "",
        tResiduoId: "",
      })
    }
  }, [ruta, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (ruta) {
        await pathService.update(ruta.id, formData)
        toast({
          title: "Ruta actualizada",
          description: "La ruta ha sido actualizada exitosamente",
        })
      } else {
        await pathService.create(formData)
        toast({
          title: "Ruta creada",
          description: "La ruta ha sido creada exitosamente",
        })
      }
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: ruta ? "No se pudo actualizar la ruta" : "No se pudo crear la ruta",
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
          <DialogTitle>{ruta ? "Editar Ruta" : "Nueva Ruta"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código *</Label>
                <div className="flex gap-2">
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    required
                    placeholder="Código único de la ruta"
                    maxLength={200}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  placeholder="Nombre descriptivo de la ruta"
                  maxLength={200}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dia">Día de la Semana *</Label>
                <Select
                  value={formData.dia}
                  onValueChange={(value: "l" | "m" | "x" | "j" | "v" | "s" | "d") =>
                    setFormData({ ...formData, dia: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un día" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAS_SEMANA.map((dia) => (
                      <SelectItem key={dia.value} value={dia.value}>
                        {dia.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="oficina">Oficina *</Label>
                <Select
                  value={formData.oficinaId ? String(formData.oficinaId) : ""}
                  onValueChange={(value) => setFormData({ ...formData, oficinaId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una oficina" />
                  </SelectTrigger>
                  <SelectContent>
                    {oficinas
                      .map((oficina) => (
                        <SelectItem key={oficina.id} value={String(oficina.id)}>
                          {oficina.nombre}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipoResiduo">Tipo de Residuo *</Label>
                <Select
                  value={formData.tResiduoId ? String(formData.tResiduoId) : ""}
                  onValueChange={(value) => setFormData({ ...formData, tResiduoId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo de residuo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposResiduo
                      .map((tipo) => (
                        <SelectItem key={tipo.id} value={String(tipo.id)}>
                          <div className="flex items-center gap-2">
                            <span>{tipo.nombre}</span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
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
                  {ruta ? "Actualizando..." : "Creando..."}
                </>
              ) : ruta ? (
                "Actualizar"
              ) : (
                "Crear"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}