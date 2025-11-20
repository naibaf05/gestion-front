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
          <DialogTitle>{readOnly ? "Ver Sede" : (sede ? "Editar Sede" : "Nueva Sede")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre" required>Nombre</Label>
                {readOnly ? (
                  <div className="text-sm py-2 px-3 rounded border bg-muted/30">{formData.nombre || "-"}</div>
                ) : (
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                    placeholder="Nombre de la sede"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cliente" required>Cliente</Label>
                {readOnly ? (
                  <div className="text-sm py-2 px-3 rounded border bg-muted/30">{clientes.find(c=>String(c.id)===String(formData.clienteId))?.nombre || "-"}</div>
                ) : (
                  <Select
                    required
                    value={formData.clienteId ? String(formData.clienteId) : ""}
                    onValueChange={(value) => setFormData({ ...formData, clienteId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={String(cliente.id)}>
                          {cliente.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion" required>Dirección</Label>
              {readOnly ? (
                <div className="text-sm py-2 px-3 rounded border bg-muted/30">{formData.direccion || "-"}</div>
              ) : (
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  required
                  placeholder="Dirección completa de la sede"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="barrio" required>Barrio</Label>
                {readOnly ? (
                  <div className="text-sm py-2 px-3 rounded border bg-muted/30">{formData.barrio || "-"}</div>
                ) : (
                  <Input
                    id="barrio"
                    value={formData.barrio}
                    onChange={(e) => setFormData({ ...formData, barrio: e.target.value })}
                    required
                    placeholder="Barrio donde se ubica"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="poblado" required>Municipio</Label>
                {readOnly ? (
                  <div className="text-sm py-2 px-3 rounded border bg-muted/30">{poblados.find(p=>String(p.id)===String(formData.pobladoId))?.nombre || "-"}</div>
                ) : (
                  <Select
                    value={formData.pobladoId ? String(formData.pobladoId) : ""}
                    onValueChange={(value) => setFormData({ ...formData, pobladoId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un municipio" />
                    </SelectTrigger>
                    <SelectContent>
                      {poblados.map((poblado) => (
                        <SelectItem key={poblado.id} value={String(poblado.id)}>
                          {poblado.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" required>Email</Label>
                {readOnly ? (
                  <div className="text-sm py-2 px-3 rounded border bg-muted/30">{formData.email || "-"}</div>
                ) : (
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="correo@ejemplo.com"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono" required>Teléfono</Label>
                {readOnly ? (
                  <div className="text-sm py-2 px-3 rounded border bg-muted/30">{formData.telefono || "-"}</div>
                ) : (
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    required
                    placeholder="Número de teléfono"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="oficina" required>Planta</Label>
                {readOnly ? (
                  <div className="text-sm py-2 px-3 rounded border bg-muted/30">{formData.oficinaId.map(id => oficinas.find(o=>String(o.id)===String(id))?.nombre).filter(Boolean).join(', ') || '-'}</div>
                ) : (
                  <SelectMultiple
                    options={oficinas.map(tc => ({ value: tc.id, label: tc.nombre }))}
                    value={formData.oficinaId}
                    onChange={selected => setFormData({ ...formData, oficinaId: selected })}
                    placeholder="Selecciona plantas"
                    disabled={readOnly}
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="generador" required>Generador</Label>
                {readOnly ? (
                  <div className="text-sm py-2 px-3 rounded border bg-muted/30">{generadores.find(g=>String(g.id)===String(formData.generadorId))?.nombre || '-'}</div>
                ) : (
                  <Select
                    value={formData.generadorId ? String(formData.generadorId) : ""}
                    onValueChange={(value) => setFormData({ ...formData, generadorId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un generador" />
                    </SelectTrigger>
                    <SelectContent>
                      {generadores.map((generador) => (
                        <SelectItem key={generador.id} value={String(generador.id)}>
                          {generador.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="periodo" required>Periodo</Label>
                {readOnly ? (
                  <div className="text-sm py-2 px-3 rounded border bg-muted/30">{periodos.find(p=>String(p.id)===String(formData.periodoId))?.nombre || '-'}</div>
                ) : (
                  <Select
                    value={formData.periodoId ? String(formData.periodoId) : ""}
                    onValueChange={(value) => setFormData({ ...formData, periodoId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un periodo" />
                    </SelectTrigger>
                    <SelectContent>
                      {periodos.map((periodo) => (
                        <SelectItem key={periodo.id} value={String(periodo.id)}>
                          {periodo.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="atencion">Frecuencia Recolección</Label>
                {readOnly ? (
                  <div className="text-sm py-2 px-3 rounded border bg-muted/30">{formData.atencion || 0}</div>
                ) : (
                  <Input
                    id="atencion"
                    type="number"
                    value={formData.atencion}
                    onChange={(e) => setFormData({ ...formData, atencion: Number.parseInt(e.target.value) || 0 })}
                    min="0"
                    placeholder="Número de atención"
                  />
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
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
