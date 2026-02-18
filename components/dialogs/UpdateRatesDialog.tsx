"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DatePicker } from "@/components/ui/date-picker"
import { SelectMultiple, OptionType } from "@/components/ui/select-multiple"
import { CircleDollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Sede } from "@/types"
import { clientService } from "@/services/clientService"
import { rateService } from "@/services/rateService"

interface UpdateRatesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tipo?: "recoleccion" | "salida"
}

export function UpdateRatesDialog({
  open,
  onOpenChange,
  tipo = "recoleccion"
}: UpdateRatesDialogProps) {
  const { toast } = useToast()

  const bogotaFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Bogota",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
    []
  )

  const getStartOfCurrentMonth = () => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }

  const [startDate, setStartDate] = useState<Date>(() => getStartOfCurrentMonth())
  const [endDate, setEndDate] = useState<Date>(() => new Date())
  const [startString, setStartString] = useState<string>(() => bogotaFormatter.format(getStartOfCurrentMonth()))
  const [endString, setEndString] = useState<string>(() => bogotaFormatter.format(new Date()))

  const [sedesOptions, setSedesOptions] = useState<Sede[]>([])
  const sedeOptions: OptionType[] = useMemo(
    () =>
      sedesOptions.map((s) => ({
        value: s.id,
        label: s.clienteNombre ? `${s.clienteNombre} - ${s.nombre}` : s.nombre,
      })),
    [sedesOptions]
  )
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loadingSedes, setLoadingSedes] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      const s = getStartOfCurrentMonth()
      const e = new Date()
      setStartDate(s)
      setEndDate(e)
      const sStr = bogotaFormatter.format(s)
      const eStr = bogotaFormatter.format(e)
      setStartString(sStr)
      setEndString(eStr)
      setSelectedIds([])
      void loadSedes(sStr, eStr)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const loadSedes = async (inicio: string, fin: string) => {
    try {
      setLoadingSedes(true)
      const sedesData = tipo === "salida" 
        ? await clientService.getSedesUpdateTarifasSalida(inicio, fin)
        : await clientService.getSedesUpdateTarifas(inicio, fin)
      setSedesOptions(sedesData)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las sedes para el rango",
        variant: "destructive",
      })
    } finally {
      setLoadingSedes(false)
    }
  }

  const handleStartChange = async (d?: Date) => {
    if (!d || isNaN(d.getTime())) return
    if (endDate && d > endDate) {
      toast({
        title: "Fecha inválida",
        description: "La fecha inicio no puede ser mayor que la fecha fin",
        variant: "destructive",
      })
      return
    }
    setStartDate(d)
    const s = bogotaFormatter.format(d)
    setStartString(s)
    await loadSedes(s, endString)
  }

  const handleEndChange = async (d?: Date) => {
    if (!d || isNaN(d.getTime())) return
    if (startDate && d < startDate) {
      toast({
        title: "Fecha inválida",
        description: "La fecha fin no puede ser menor que la fecha inicio",
        variant: "destructive",
      })
      return
    }
    setEndDate(d)
    const s = bogotaFormatter.format(d)
    setEndString(s)
    await loadSedes(startString, s)
  }

  const handleSedesChange = (ids: string[]) => setSelectedIds(ids)

  const handleSave = async () => {
    if (!startString || !endString) return
    if (selectedIds.length === 0) {
      toast({
        title: "Selecciona sedes",
        description: "Debes seleccionar al menos una sede",
        variant: "destructive",
      })
      return
    }
    try {
      setSaving(true)
      if (tipo === "salida") {
        await rateService.updateTarifasSalida(startString, endString, selectedIds)
      } else {
        await rateService.updateTarifas(startString, endString, selectedIds)
      }
      toast({
        title: "Actualización realizada",
        description: "Las tarifas se han actualizado correctamente",
        variant: "success"
      })
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "No se pudo actualizar tarifas",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CircleDollarSign className="h-5 w-5" />
            Actualizar Tarifas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Inicio:</label>
              <DatePicker date={startDate} onDateChange={handleStartChange} placeholder="dd/mm/aaaa" className="w-40" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Fin:</label>
              <DatePicker date={endDate} onDateChange={handleEndChange} placeholder="dd/mm/aaaa" className="w-40" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Sedes</span>
              <span className="text-xs text-muted-foreground">{selectedIds.length} seleccionadas</span>
            </div>
            {loadingSedes ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="min-h-[48px]">
                <SelectMultiple
                  options={sedeOptions}
                  value={selectedIds}
                  onChange={handleSedesChange}
                  placeholder="Selecciona sedes"
                />
                {sedesOptions.length === 0 && (
                  <div className="text-sm text-muted-foreground mt-2">No hay sedes para el rango seleccionado.</div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loadingSedes} className="bg-primary hover:bg-primary-hover">
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
