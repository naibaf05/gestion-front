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
import { clientService } from "@/services/clientService"
import type { Sede, Cliente, Parametrizacion } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { SelectMultiple } from "../ui/select-multiple"

interface SedeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sede?: Sede | null
  clientes: Cliente[]
  poblados: Parametrizacion[]
  oficinas: Parametrizacion[]
  generadores: Parametrizacion[]
  periodos: Parametrizacion[]
  onSuccess: () => void
  readOnly?: boolean
}

export function SedeDialog({
  open,
  onOpenChange,
  sede,
  clientes,
  poblados,
  oficinas,
  generadores,
  periodos,
  onSuccess,
  readOnly = false,
}: SedeDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    clienteId: "",
    nit: "",
    barrio: "",
    direccion: "",
    pobladoId: "",
    oficinaId: [] as string[],
    email: "",
    telefono: "",
    generadorId: "",
    periodoId: "",
    atencion: 0,
  })
  const { toast } = useToast()

  useEffect(() => {
    if (sede) {
      setFormData({
        nombre: sede.nombre,
        clienteId: sede.clienteId,
        nit: sede.nit,
        barrio: sede.barrio,
        direccion: sede.direccion,
        pobladoId: sede.pobladoId,
        oficinaId: sede.oficinaId,
        email: sede.email,
        telefono: sede.telefono,
        generadorId: sede.generadorId,
        periodoId: sede.periodoId,
        atencion: sede.atencion,
      })
    } else {
      setFormData({
        nombre: "",
        clienteId: "",
        nit: "",
        barrio: "",
        direccion: "",
        pobladoId: "",
        oficinaId: [],
        email: "",
        telefono: "",
        generadorId: "",
        periodoId: "",
        atencion: 0,
      })
    }
  }, [sede, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (readOnly) {
      onOpenChange(false)
      return
    }
    setLoading(true)

    try {
      if (sede) {
        const response = await clientService.updateSede(sede.id, formData)
        toast({
          title: "Sede actualizada",
          description: response.message || "La sede ha sido actualizada exitosamente",
          variant: "success",
        })
      } else {
        const response = await clientService.createSede(formData)
        toast({
          title: "Sede creada",
          description: response.message || "La sede ha sido creada exitosamente",
          variant: "success",
        })
      }
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: sede ? "No se pudo actualizar la sede" : "No se pudo crear la sede",
        description: error.message || "Error inesperado",
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
          <DialogTitle>{readOnly ? "Ver Sede" : (sede ? "Editar Sede" : "Nueva Sede")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre" required>Nombre</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  disabled={readOnly}
                  readOnly={readOnly}
                  placeholder="Nombre de la sede"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cliente" required>Cliente</Label>
                <SelectSingle
                  id="clienteId"
                  placeholder="Selecciona un cliente"
                  value={formData.clienteId}
                  onChange={(value) => setFormData({ ...formData, clienteId: value })}
                  options={clientes}
                  valueKey="id"
                  labelKey="nombre"
                  disabled={readOnly}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nit">Nit</Label>
                <Input
                  id="nit"
                  value={formData.nit}
                  onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                  required
                  disabled={readOnly}
                  readOnly={readOnly}
                  placeholder="Nit de la sede"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion" required>Dirección</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  required
                  disabled={readOnly}
                  readOnly={readOnly}
                  placeholder="Dirección completa de la sede"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="barrio" required>Barrio</Label>
                <Input
                  id="barrio"
                  value={formData.barrio}
                  onChange={(e) => setFormData({ ...formData, barrio: e.target.value })}
                  required
                  disabled={readOnly}
                  readOnly={readOnly}
                  placeholder="Barrio donde se ubica"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="poblado" required>Municipio</Label>
                <SelectSingle
                  id="pobladoId"
                  placeholder="Selecciona un municipio"
                  value={formData.pobladoId}
                  onChange={(value) => setFormData({ ...formData, pobladoId: value })}
                  options={poblados}
                  valueKey="id"
                  labelKey="nombre"
                  disabled={readOnly}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" required>Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={readOnly}
                  readOnly={readOnly}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono" required>Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  required
                  disabled={readOnly}
                  readOnly={readOnly}
                  placeholder="Número de teléfono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="oficina" required>Planta</Label>
                <SelectMultiple
                  options={oficinas.map(tc => ({ value: tc.id, label: tc.nombre }))}
                  value={formData.oficinaId}
                  onChange={selected => setFormData({ ...formData, oficinaId: selected })}
                  placeholder="Selecciona plantas"
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="generador">Generador</Label>
                <SelectSingle
                  id="generadorId"
                  placeholder="Selecciona un generador"
                  value={formData.generadorId}
                  onChange={(value) => setFormData({ ...formData, generadorId: value })}
                  options={generadores}
                  valueKey="id"
                  labelKey="nombre"
                  disabled={readOnly}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="periodo" required>Periodo</Label>
                <SelectSingle
                  id="periodoId"
                  placeholder="Selecciona un periodo"
                  value={formData.periodoId}
                  onChange={(value) => setFormData({ ...formData, periodoId: value })}
                  options={periodos}
                  valueKey="id"
                  labelKey="nombre"
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="atencion">Frecuencia Recolección</Label>
                <Input
                  id="atencion"
                  type="number"
                  value={formData.atencion}
                  onChange={(e) => setFormData({ ...formData, atencion: Number.parseInt(e.target.value) || 0 })}
                  min="0"
                  required
                  disabled={readOnly}
                  readOnly={readOnly}
                  placeholder="Número de atención"
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
                    {sede ? "Actualizando..." : "Creando..."}
                  </>
                ) : sede ? (
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
