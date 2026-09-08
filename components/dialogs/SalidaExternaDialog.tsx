"use client"

import type React from "react"
import { useEffect, useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InputCheck } from "@/components/ui/input-check"
import { InputDecimal } from "@/components/ui/input-decimal"
import { Loader2, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Parametrizacion, RateParam, SalidaExterna, Sede, User, Vehicle } from "@/types"
import { salidaExternaService } from "@/services/salidaExternaService"
import { rateParamService } from "@/services/rateParamService"
import { VehicleManualDialog } from "./VehicleManualDialog"
import { useAuth } from "@/contexts/AuthContext"

interface SalidaExternaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  salidaExterna?: SalidaExterna | null
  sedes: Sede[]
  vehiculos: Vehicle[]
  conductores: User[]
  receptores: User[]
  comerciales: Parametrizacion[]
  gestores: Parametrizacion[]
  fletes: Parametrizacion[]
  fletesGestion: Parametrizacion[]
  fletesFocus: Parametrizacion[]
  plantas: Parametrizacion[]
  onSuccess: () => void
  onVehiclesUpdate?: () => void
  readOnly?: boolean
}

const TIPOS = [
  { value: "puesto", label: "Puesto en planta" },
  { value: "eventual", label: "Eventual" },
  { value: "ruta", label: "Ruta" },
]

export function SalidaExternaDialog({
  open,
  onOpenChange,
  salidaExterna,
  sedes,
  vehiculos,
  conductores,
  receptores,
  comerciales,
  gestores,
  fletes,
  fletesGestion,
  fletesFocus,
  plantas,
  onSuccess,
  onVehiclesUpdate,
  readOnly = false,
}: SalidaExternaDialogProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [fletesDisponibles, setFletesDisponibles] = useState<Parametrizacion[]>(fletes)
  const [openManualDialog, setOpenManualDialog] = useState(false)
  const [formData, setFormData] = useState({
    tipo: "",
    fecha: "",
    inicio: "",
    fin: "",
    plantaId: "",
    sedeSalidaId: "",
    sedeId: "",
    plantaDestinoId: "",
    vehiculoId: "",
    conductorId: "",
    receptorId: "",
    comercialId: "",
    gestorId: "",
    fleteId: "",
    fleteGestionId: "",
    fleteFocusId: "",
    tarifaFleteId: "",
    tarifaFleteNombre: "",
    tarifaFleteGestionId: "",
    tarifaFleteGestionNombre: "",
    tarifaFleteFocusId: "",
    tarifaFleteFocusNombre: "",
    tarifaGestorId: "",
    tarifaGestorNombre: "",
    notas: "",
    lat: "",
    lon: "",
    esSede: false,
    esPlanta: false,
  })

  const { toast } = useToast()

  if (user && user.permisos && typeof user.permisos === "string") {
    user.permisos = JSON.parse(user.permisos)
  }

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permisos) return false
    if (user.perfil?.nombre === "ADMIN") return true
    return user.permisos[permission] === true
  }

  useEffect(() => {
    setFletesDisponibles(fletes)
  }, [fletes])

  useEffect(() => {
    if (!open || salidaExterna) return
    const sedeIds = [formData.sedeSalidaId, formData.sedeId].filter(Boolean)
    if (sedeIds.length === 0) {
      setFletesDisponibles([])
      return
    }

    rateParamService.getTableBySedes(sedeIds).then((tarifas) => {
      const ids = new Set(tarifas.map((tarifa) => String(tarifa.parametrizacionId)))
      setFletesDisponibles(fletes.filter((flete) => ids.has(String(flete.id))))
    }).catch(() => setFletesDisponibles([]))
  }, [open, salidaExterna, formData.sedeSalidaId, formData.sedeId, fletes])

  const isDateInRateRange = (fecha: string, rate: RateParam): boolean => {
    if (!fecha || !rate?.fechaInicio) return false
    if (fecha < rate.fechaInicio) return false
    if (rate.fechaFin && fecha > rate.fechaFin) return false
    return true
  }

  const findVigenteRate = async (parametrizacionId: string, fecha: string, sedeIds: string[] = []): Promise<RateParam | null> => {
    if (!parametrizacionId || !fecha) return null
    const rates = sedeIds.length > 0
      ? (await rateParamService.getTableBySedes(sedeIds)).filter((rate) => String(rate.parametrizacionId) === String(parametrizacionId))
      : await rateParamService.getTable(parametrizacionId)
    const vigentes = rates
      .filter((r) => r.activo && isDateInRateRange(fecha, r))
      .sort((a, b) => String(b.fechaInicio || "").localeCompare(String(a.fechaInicio || "")))
    return vigentes[0] || null
  }

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          lat: `${position.coords.latitude}`,
          lon: `${position.coords.longitude}`,
        }))
      },
      () => {
      }
    )
  }, [])

  useEffect(() => {
    if (salidaExterna) {
      setFormData({
        tipo: salidaExterna.tipo || "",
        fecha: salidaExterna.fecha ? salidaExterna.fecha.split("T")[0] : "",
        inicio: salidaExterna.inicio || "",
        fin: salidaExterna.fin || "",
        plantaId: salidaExterna.plantaId || "",
        sedeSalidaId: salidaExterna.sedeSalidaId || "",
        sedeId: salidaExterna.sedeId || "",
        plantaDestinoId: salidaExterna.plantaDestinoId || "",
        vehiculoId: salidaExterna.vehiculoId || "",
        conductorId: salidaExterna.conductorId || "",
        receptorId: salidaExterna.receptorId || "",
        comercialId: salidaExterna.comercialId || "",
        gestorId: salidaExterna.gestorId || "",
        fleteId: salidaExterna.fleteId || "",
        fleteGestionId: salidaExterna.fleteGestionId || salidaExterna.fleteId || "",
        fleteFocusId: salidaExterna.fleteFocusId || "",
        tarifaFleteId: salidaExterna.tarifaFleteId || "",
        tarifaFleteNombre: salidaExterna.tarifaFleteNombre || "",
        tarifaFleteGestionId: salidaExterna.tarifaFleteGestionId || salidaExterna.tarifaFleteId || "",
        tarifaFleteGestionNombre: salidaExterna.tarifaFleteGestionNombre || salidaExterna.tarifaFleteNombre || "",
        tarifaFleteFocusId: salidaExterna.tarifaFleteFocusId || "",
        tarifaFleteFocusNombre: salidaExterna.tarifaFleteFocusNombre || "",
        tarifaGestorId: salidaExterna.tarifaGestorId || "",
        tarifaGestorNombre: salidaExterna.tarifaGestorNombre || "",
        notas: salidaExterna.notas || "",
        lat: salidaExterna.lat || "",
        lon: salidaExterna.lon || "",
        esSede: !!salidaExterna.sedeSalidaId,
        esPlanta: !!salidaExterna.plantaDestinoId,
      })
      return
    }

    const today = new Date().toISOString().split("T")[0]
    setFormData((prev) => ({
      ...prev,
      tipo: "",
      fecha: today,
      inicio: "",
      fin: "",
      plantaId: "",
      sedeSalidaId: "",
      sedeId: "",
      plantaDestinoId: "",
      vehiculoId: "",
      conductorId: "",
      receptorId: "",
      comercialId: "",
      gestorId: "",
      fleteId: "",
      fleteGestionId: "",
      fleteFocusId: "",
      tarifaFleteId: "",
      tarifaFleteNombre: "",
      tarifaFleteGestionId: "",
      tarifaFleteGestionNombre: "",
      tarifaFleteFocusId: "",
      tarifaFleteFocusNombre: "",
      tarifaGestorId: "",
      tarifaGestorNombre: "",
      notas: "",
      esSede: false,
      esPlanta: false,
    }))
  }, [salidaExterna, open])

  useEffect(() => {
    if (!open) return

    const resolveTarifas = async () => {
      try {
        const [rateFleteGestion, rateFleteFocus, rateGestor] = await Promise.all([
          formData.fleteGestionId ? findVigenteRate(formData.fleteGestionId, formData.fecha, [formData.sedeSalidaId, formData.sedeId].filter(Boolean)) : Promise.resolve(null),
          formData.fleteFocusId ? findVigenteRate(formData.fleteFocusId, formData.fecha, [formData.sedeSalidaId, formData.sedeId].filter(Boolean)) : Promise.resolve(null),
          formData.gestorId ? findVigenteRate(formData.gestorId, formData.fecha) : Promise.resolve(null),
        ])

        setFormData((prev) => ({
          ...prev,
          tarifaFleteGestionId: rateFleteGestion?.id || "",
          tarifaFleteGestionNombre: rateFleteGestion?.tarifaNombre || (prev.fleteGestionId ? "Sin tarifa vigente" : ""),
          tarifaFleteFocusId: rateFleteFocus?.id || "",
          tarifaFleteFocusNombre: rateFleteFocus?.tarifaNombre || (prev.fleteFocusId ? "Sin tarifa vigente" : ""),
          tarifaGestorId: rateGestor?.id || "",
          tarifaGestorNombre: rateGestor?.tarifaNombre || (prev.gestorId ? "Sin tarifa vigente" : ""),
        }))
      } catch {
        setFormData((prev) => ({
          ...prev,
          tarifaFleteGestionId: "",
          tarifaFleteGestionNombre: prev.fleteGestionId ? "No se pudo consultar tarifa" : "",
          tarifaFleteFocusId: "",
          tarifaFleteFocusNombre: prev.fleteFocusId ? "No se pudo consultar tarifa" : "",
          tarifaGestorId: "",
          tarifaGestorNombre: prev.gestorId ? "No se pudo consultar tarifa" : "",
        }))
      }
    }

    resolveTarifas()
  }, [open, formData.fecha, formData.fleteGestionId, formData.fleteFocusId, formData.gestorId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (readOnly) {
      onOpenChange(false)
      return
    }

    setLoading(true)
    try {
      const payload: any = {
        ...formData,
      }

      payload.fleteId = payload.fleteGestionId || null
      payload.tarifaFleteId = payload.tarifaFleteGestionId || null
      delete payload.tarifaFleteGestionNombre
      delete payload.tarifaFleteFocusNombre

      if (payload.esSede) {
        payload.plantaId = ""
      } else {
        payload.sedeSalidaId = ""
      }

      if (payload.esPlanta) {
        payload.sedeId = ""
      } else {
        payload.plantaDestinoId = ""
      }

      delete payload.esSede
      delete payload.esPlanta

      if (salidaExterna) {
        await salidaExternaService.updateSalidaExterna(salidaExterna.id, payload)
        toast({ title: "Salida externa actualizada", description: "Los datos se actualizaron correctamente", variant: "success" })
      } else {
        await salidaExternaService.createSalidaExterna(payload)
        toast({ title: "Salida externa creada", description: "Los datos se guardaron correctamente", variant: "success" })
      }

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: salidaExterna ? "Error al actualizar" : "Error al crear",
        description: error?.message || "No se pudo guardar la salida externa",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{readOnly ? "Ver Salida Externa" : salidaExterna ? "Editar Salida Externa" : "Nueva Salida Externa"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basico" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basico">Basico</TabsTrigger>
              <TabsTrigger value="complemento">Complemento</TabsTrigger>
            </TabsList>

            <TabsContent value="basico" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="tipo" required>Tipo</Label>
                  <SelectSingle
                    id="tipo"
                    placeholder="Selecciona un tipo"
                    options={TIPOS}
                    value={formData.tipo}
                    onChange={(value) => setFormData({ ...formData, tipo: value })}
                    valueKey="value"
                    labelKey="label"
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inicio" required>Inicio</Label>
                  <Input
                    id="inicio"
                    type="time"
                    value={formData.inicio}
                    onChange={(e) => setFormData({ ...formData, inicio: e.target.value })}
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fin">Fin</Label>
                  <Input
                    id="fin"
                    type="time"
                    value={formData.fin}
                    onChange={(e) => setFormData({ ...formData, fin: e.target.value })}
                    disabled={readOnly}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salida" required>Salida</Label>
                <span style={{ paddingLeft: "15px" }}>
                  <InputCheck
                    id="esSede"
                    checked={formData.esSede}
                    onChange={(e) => setFormData({ ...formData, esSede: e.target.checked, plantaId: "", sedeSalidaId: "" })}
                    label="Es sede"
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
                    id="plantaId"
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
                <Label htmlFor="destino" required>Destino</Label>
                <span style={{ paddingLeft: "15px" }}>
                  <InputCheck
                    id="esPlanta"
                    checked={formData.esPlanta}
                    onChange={(e) => setFormData({ ...formData, esPlanta: e.target.checked, sedeId: "", plantaDestinoId: "" })}
                    label="Es planta"
                  />
                </span>
                {formData.esPlanta ? (
                  <SelectSingle
                    id="plantaDestinoId"
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
                    id="sedeDestino"
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
                  <Label htmlFor="vehiculo">Vehiculo</Label>
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
                  placeholder="Selecciona un vehiculo"
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
                  <Label htmlFor="conductor" required>Conductor</Label>
                  <SelectSingle
                    id="conductor"
                    placeholder="Selecciona un conductor"
                    options={conductores}
                    value={formData.conductorId}
                    onChange={(value) => setFormData({ ...formData, conductorId: value })}
                    valueKey="id"
                    labelKey="nombreCompleto"
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receptor" required>Receptor</Label>
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
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="comercial" required>Comercial</Label>
                  <SelectSingle
                    id="comercial"
                    placeholder="Selecciona un comercial"
                    options={comerciales}
                    value={formData.comercialId}
                    onChange={(value) => setFormData({ ...formData, comercialId: value })}
                    valueKey="id"
                    labelKey="nombre"
                    disabled={readOnly}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="complemento" className="space-y-4 pt-4">
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
                </div>
                <>
                <div className="space-y-2">
                  <Label htmlFor="fleteGestion">Flete Gestión</Label>
                  <SelectSingle
                    id="fleteGestion"
                    placeholder="Selecciona un flete de gestión"
                    options={fletesGestion}
                    value={formData.fleteGestionId}
                    onChange={(value) => setFormData({ ...formData, fleteGestionId: value, tarifaFleteGestionId: "", tarifaFleteGestionNombre: "" })}
                    valueKey="id"
                    labelKey="nombreMostrar"
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fleteFocus">Flete Focus</Label>
                  <SelectSingle
                    id="fleteFocus"
                    placeholder="Selecciona un flete Focus"
                    options={fletesFocus}
                    value={formData.fleteFocusId}
                    onChange={(value) => setFormData({ ...formData, fleteFocusId: value, tarifaFleteFocusId: "", tarifaFleteFocusNombre: "" })}
                    valueKey="id"
                    labelKey="nombreMostrar"
                    disabled={readOnly}
                  />
                </div>
                </>
                {hasPermission("rates.view") && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="tarifaGestorNombre">Tarifa Gestor</Label>
                      <Input
                        id="tarifaGestorNombre"
                        value={formData.tarifaGestorNombre}
                        placeholder="Tarifa de gestor"
                        disabled={true}
                        readOnly={true}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tarifaFleteGestionNombre">Tarifa Flete Gestión</Label>
                      <Input
                        id="tarifaFleteGestionNombre"
                        value={formData.tarifaFleteGestionNombre}
                        placeholder="Tarifa de flete gestión"
                        disabled={true}
                        readOnly={true}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tarifaFleteFocusNombre">Tarifa Flete Focus</Label>
                      <Input
                        id="tarifaFleteFocusNombre"
                        value={formData.tarifaFleteFocusNombre}
                        placeholder="Tarifa de flete Focus"
                        disabled={true}
                        readOnly={true}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notas">Notas</Label>
                <Textarea
                  id="notas"
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows={3}
                  placeholder="Observaciones adicionales"
                  disabled={readOnly}
                  readOnly={readOnly}
                  maxLength={500}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {readOnly ? "Cerrar" : "Cancelar"}
            </Button>
            {!readOnly && (
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : salidaExterna ? "Actualizar" : "Crear"}
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
