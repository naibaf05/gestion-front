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
import type { Cliente, Poblado, Comercial } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface ClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: Cliente | null
  poblados: Poblado[]
  comerciales: Comercial[]
  onSuccess: () => void
}

export function ClientDialog({ open, onOpenChange, client, poblados, comerciales, onSuccess }: ClientDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    barrio: "",
    fechaRenovacion: "",
    nit: "",
    telefono: "",
    direccion: "",
    contacto: "",
    pobladoId: "",
    comercialId: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    if (client) {
      setFormData({
        nombre: client.nombre,
        barrio: client.barrio,
        fechaRenovacion: client.fechaRenovacion,
        nit: client.nit,
        telefono: client.telefono,
        direccion: client.direccion,
        contacto: client.contacto,
        pobladoId: client.pobladoId,
        comercialId: client.comercialId,
      })
    } else {
      setFormData({
        nombre: "",
        barrio: "",
        fechaRenovacion: "",
        nit: "",
        telefono: "",
        direccion: "",
        contacto: "",
        pobladoId: "",
        comercialId: "",
      })
    }
  }, [client, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (client) {
        await clientService.updateCliente(client.id, formData)
        toast({
          title: "Cliente actualizado",
          description: "El cliente ha sido actualizado exitosamente",
        })
      } else {
        await clientService.createCliente(formData)
        toast({
          title: "Cliente creado",
          description: "El cliente ha sido creado exitosamente",
        })
      }
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: client ? "No se pudo actualizar el cliente" : "No se pudo crear el cliente",
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
          <DialogTitle>{client ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nit">NIT *</Label>
                <Input
                  id="nit"
                  value={formData.nit}
                  onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contacto">Contacto *</Label>
                <Input
                  id="contacto"
                  value={formData.contacto}
                  onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección *</Label>
              <Input
                id="direccion"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                required
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaRenovacion">Fecha de Renovación</Label>
                <Input
                  id="fechaRenovacion"
                  type="date"
                  value={formData.fechaRenovacion}
                  onChange={(e) => setFormData({ ...formData, fechaRenovacion: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="poblado">Municipio *</Label>
                <Select
                  value={formData.pobladoId ? String(formData.pobladoId) : ""}
                  onValueChange={(value) => setFormData({ ...formData, pobladoId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un poblado" />
                  </SelectTrigger>
                  <SelectContent>
                    {poblados.map((poblado) => (
                      <SelectItem key={poblado.id} value={String(poblado.id)}>
                        {poblado.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="comercial">Comercial *</Label>
                <Select
                  value={formData.comercialId ? String(formData.comercialId) : ""}
                  onValueChange={(value) => setFormData({ ...formData, comercialId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un comercial" />
                  </SelectTrigger>
                  <SelectContent>
                    {comerciales.map((comercial) => (
                      <SelectItem key={comercial.id} value={String(comercial.id)}>
                        {comercial.nombre}
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
                  {client ? "Actualizando..." : "Creando..."}
                </>
              ) : client ? (
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