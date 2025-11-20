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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { clientService } from "@/services/clientService"
import type { Cliente, Parametrizacion } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { Card, CardContent } from "../ui/card"
import { SelectMultiple } from "@/components/ui/select-multiple"
import { InputPositiveInteger } from "../ui/input-positive-integer"

interface ClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: Cliente | null
  poblados: Parametrizacion[]
  comerciales: Parametrizacion[]
  tClientes: Parametrizacion[]
  onSuccess: () => void
  readOnly?: boolean // modo solo lectura
}

export function ClientDialog({ open, onOpenChange, client, poblados, comerciales, tClientes, onSuccess, readOnly = false }: ClientDialogProps) {
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
    fechaCierreFacturacion: "",
    correo: "",
    correoFacturacion: "",
    tiposClienteIds: [] as string[],
    datosJson: {} as any,
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
        fechaCierreFacturacion: client.fechaCierreFacturacion || "",
        correo: client.correo || "",
        correoFacturacion: client.correoFacturacion || "",
        tiposClienteIds: client.tiposClienteIds || [],
        datosJson: client.datosJson || {},
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
        fechaCierreFacturacion: "",
        correo: "",
        correoFacturacion: "",
        tiposClienteIds: [],
        datosJson: {},
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
          variant: "success",
        })
      } else {
        await clientService.createCliente(formData)
        toast({
          title: "Cliente creado",
          description: "El cliente ha sido creado exitosamente",
          variant: "success",
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
      <DialogContent className="sm:max-w-[750px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? (readOnly ? "Detalle Cliente" : "Editar Cliente") : "Nuevo Cliente"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basica">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basica">Basica</TabsTrigger>
              <TabsTrigger value="adicional">Adicional</TabsTrigger>
            </TabsList>

            <TabsContent value="basica">
              <Card>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nombre" required>Nombre</Label>
                        <Input
                          id="nombre"
                          value={formData.nombre}
                          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                          required
                          autoComplete="off"
                          maxLength={100}
                          disabled={readOnly}
                          readOnly={readOnly}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nit" required>NIT</Label>
                        <Input
                          id="nit"
                          value={formData.nit}
                          onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                          required
                          autoComplete="off"
                          maxLength={20}
                          disabled={readOnly}
                          readOnly={readOnly}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nombreComercial">Nombre Comercial</Label>
                        <Input
                          id="nombreComercial"
                          value={formData.datosJson?.nombreComercial || ""}
                          onChange={(e) => setFormData({ ...formData, datosJson: { ...formData.datosJson, nombreComercial: e.target.value } })}
                          autoComplete="off"
                          maxLength={100}
                          disabled={readOnly}
                          readOnly={readOnly}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contacto" required>Contacto</Label>
                        <Input
                          id="contacto"
                          value={formData.contacto}
                          onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                          required
                          autoComplete="off"
                          maxLength={100}
                          disabled={readOnly}
                          readOnly={readOnly}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="direccion" required>Dirección</Label>
                      <Input
                        id="direccion"
                        value={formData.direccion}
                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                        required
                        autoComplete="off"
                        maxLength={200}
                        disabled={readOnly}
                        readOnly={readOnly}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="barrio" required>Barrio</Label>
                        <Input
                          id="barrio"
                          value={formData.barrio}
                          onChange={(e) => setFormData({ ...formData, barrio: e.target.value })}
                          required
                          autoComplete="off"
                          maxLength={100}
                          disabled={readOnly}
                          readOnly={readOnly}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefono" required>Teléfono</Label>
                        <Input
                          id="telefono"
                          value={formData.telefono}
                          onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                          required
                          autoComplete="off"
                          maxLength={20}
                          disabled={readOnly}
                          readOnly={readOnly}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="poblado" required>Municipio</Label>
                        <Select
                          value={formData.pobladoId ? String(formData.pobladoId) : ""}
                          onValueChange={(value) => setFormData({ ...formData, pobladoId: value })}
                          disabled={readOnly}
                        >
                          <SelectTrigger disabled={readOnly}>
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
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="comercial" required>Comercial</Label>
                        <Select
                          value={formData.comercialId ? String(formData.comercialId) : ""}
                          onValueChange={(value) => setFormData({ ...formData, comercialId: value })}
                          disabled={readOnly}
                        >
                          <SelectTrigger disabled={readOnly}>
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="adicional">
              <Card>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fechaRenovacion">Fecha de Renovación</Label>
                        <Input
                          id="fechaRenovacion"
                          type="date"
                          value={formData.fechaRenovacion}
                          onChange={(e) => setFormData({ ...formData, fechaRenovacion: e.target.value })}
                          autoComplete="off"
                          disabled={readOnly}
                          readOnly={readOnly}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fechaCierreFacturacion">Fecha Cierre Facturación</Label>
                        <InputPositiveInteger
                          value={formData.datosJson.fechaCierreFacturacion}
                          onChange={(e) => setFormData({ ...formData, datosJson: { ...formData.datosJson, fechaCierreFacturacion: e.target.value } })}
                          disabled={readOnly}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="correo">Correo</Label>
                        <Input
                          id="correo"
                          type="email"
                          value={formData.datosJson.correo}
                          onChange={(e) => setFormData({ ...formData, datosJson: { ...formData.datosJson, correo: e.target.value } })}
                          autoComplete="off"
                          maxLength={100}
                          disabled={readOnly}
                          readOnly={readOnly}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="correoFacturacion">Correo Facturación</Label>
                        <Input
                          id="correoFacturacion"
                          type="email"
                          value={formData.datosJson.correoFacturacion}
                          onChange={(e) => setFormData({ ...formData, datosJson: { ...formData.datosJson, correoFacturacion: e.target.value } })}
                          autoComplete="off"
                          maxLength={100}
                          disabled={readOnly}
                          readOnly={readOnly}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tiposCliente">Tipo de Cliente</Label>
                        <SelectMultiple
                          options={tClientes.map(tc => ({ value: tc.id, label: tc.nombre }))}
                          value={formData.tiposClienteIds}
                          onChange={selected => setFormData({ ...formData, tiposClienteIds: selected })}
                          placeholder="Selecciona tipos de cliente"
                          disabled={readOnly}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contratoComodato">Contenedores Comodato</Label>
                        <InputPositiveInteger
                          value={formData.datosJson.contratoComodato}
                          onChange={(e) => setFormData({ ...formData, datosJson: { ...formData.datosJson, contratoComodato: e.target.value } })}
                          disabled={readOnly}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fechaVencimientoContrato">Fecha Vencimiento Contrato Comodato</Label>
                        <Input
                          id="fechaVencimientoContrato"
                          type="date"
                          value={formData.datosJson.fechaVencimientoContrato}
                          onChange={(e) => setFormData({ ...formData, datosJson: { ...formData.datosJson, fechaVencimientoContrato: e.target.value } })}
                          autoComplete="off"
                          disabled={readOnly}
                          readOnly={readOnly}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {readOnly ? "Cerrar" : "Cancelar"}
            </Button>
            {!readOnly && (
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
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}