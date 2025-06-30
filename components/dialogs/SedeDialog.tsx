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
import { clientService } from "@/services/clientService"
import type { Sede, Cliente, Poblado, Oficina, Generador, Periodo, Parametrizacion } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

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
}: SedeDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    clienteId: "",
    barrio: "",
    direccion: "",
    pobladoId: "",
    oficinaId: "",
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
        barrio: "",
        direccion: "",
        pobladoId: "",
        oficinaId: "",
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
    setLoading(true)

    try {
      if (sede) {
        await clientService.updateSede(sede.id, formData)
        toast({
          title: "Sede actualizada",
          description: "La sede ha sido actualizada exitosamente",
        })
      } else {
        await clientService.createSede(formData)
        toast({
          title: "Sede creada",
          description: "La sede ha sido creada exitosamente",
        })
      }
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: sede ? "No se pudo actualizar la sede" : "No se pudo crear la sede",
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
          <DialogTitle>{sede ? "Editar Sede" : "Nueva Sede"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  placeholder="Nombre de la sede"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente *</Label>
                <Select
                  value={formData.clienteId}
                  onValueChange={(value) => setFormData({ ...formData, clienteId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección *</Label>
              <Input
                id="direccion"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                required
                placeholder="Dirección completa de la sede"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="barrio">Barrio *</Label>
                <Input
                  id="barrio"
                  value={formData.barrio}
                  onChange={(e) => setFormData({ ...formData, barrio: e.target.value })}
                  required
                  placeholder="Barrio donde se ubica"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="poblado">Poblado *</Label>
                <Select
                  value={formData.pobladoId}
                  onValueChange={(value) => setFormData({ ...formData, pobladoId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un poblado" />
                  </SelectTrigger>
                  <SelectContent>
                    {poblados.map((poblado) => (
                      <SelectItem key={poblado.id} value={poblado.id}>
                        {poblado.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  required
                  placeholder="Número de teléfono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="oficina">Oficina *</Label>
                <Select
                  value={formData.oficinaId}
                  onValueChange={(value) => setFormData({ ...formData, oficinaId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una oficina" />
                  </SelectTrigger>
                  <SelectContent>
                    {oficinas.map((oficina) => (
                      <SelectItem key={oficina.id} value={oficina.id}>
                        {oficina.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="generador">Generador *</Label>
                <Select
                  value={formData.generadorId}
                  onValueChange={(value) => setFormData({ ...formData, generadorId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un generador" />
                  </SelectTrigger>
                  <SelectContent>
                    {generadores.map((generador) => (
                      <SelectItem key={generador.id} value={generador.id}>
                        {generador.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="periodo">Periodo *</Label>
                <Select
                  value={formData.periodoId}
                  onValueChange={(value) => setFormData({ ...formData, periodoId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodos.map((periodo) => (
                      <SelectItem key={periodo.id} value={periodo.id}>
                        {periodo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="atencion">Frecuencia Recolección</Label>
                <Input
                  id="atencion"
                  type="number"
                  value={formData.atencion}
                  onChange={(e) => setFormData({ ...formData, atencion: Number.parseInt(e.target.value) || 0 })}
                  min="0"
                  placeholder="Número de atención"
                />
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
                  {sede ? "Actualizando..." : "Creando..."}
                </>
              ) : sede ? (
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
