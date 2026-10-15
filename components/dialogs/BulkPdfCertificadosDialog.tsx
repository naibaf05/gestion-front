"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DatePicker } from "@/components/ui/date-picker"
import { SelectMultiple, OptionType } from "@/components/ui/select-multiple"
import { SelectSingle } from "@/components/ui/select-single"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Download, UserPlus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Cliente, Sede, User } from "@/types"
import { clientService } from "@/services/clientService"
import { certificatesService } from "@/services/certificatesService"

const TAB_LABELS: Record<string, string> = {
  "1": "Llantas",
  "2": "Residuos",
  "3": "Proforma",
  "4": "Proforma_Salidas",
  "6": "Proforma_Externas",
}

interface BulkPdfCertificadosDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tipo: string
  user?: User | null
  clientes?: Cliente[]
}

export function BulkPdfCertificadosDialog({
  open,
  onOpenChange,
  tipo,
  user,
  clientes = [],
}: BulkPdfCertificadosDialogProps) {
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
  const [downloading, setDownloading] = useState(false)
  const [popoverClienteOpen, setPopoverClienteOpen] = useState(false)
  const [filtroClienteSedes, setFiltroClienteSedes] = useState("")

  useEffect(() => {
    if (open) {
      const s = getStartOfCurrentMonth()
      const e = new Date()
      setStartDate(s)
      setEndDate(e)
      setStartString(bogotaFormatter.format(s))
      setEndString(bogotaFormatter.format(e))
      setSelectedIds([])
      setFiltroClienteSedes("")
      setPopoverClienteOpen(false)
      void loadSedes()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const loadSedes = async () => {
    try {
      setLoadingSedes(true)
      const esCliente = user?.perfil?.nombre === "CLIENTE"
      const data = esCliente
        ? await clientService.getSedesActivasByCliente(user!.id)
        : await clientService.getSedesActivas()
      setSedesOptions(data ?? [])
    } catch {
      toast({
        title: "Error",
        description: "No se pudieron cargar las sedes",
        variant: "destructive",
      })
    } finally {
      setLoadingSedes(false)
    }
  }

  const handleStartChange = (d?: Date) => {
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
    setStartString(bogotaFormatter.format(d))
  }

  const handleEndChange = (d?: Date) => {
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
    setEndString(bogotaFormatter.format(d))
  }

  const handleDownload = async () => {
    if (selectedIds.length === 0) {
      toast({
        title: "Selecciona sedes",
        description: "Debes seleccionar al menos una sede",
        variant: "destructive",
      })
      return
    }
    try {
      setDownloading(true)
      const zipBase64 = await certificatesService.getCertificadosZipByFiltro(tipo, startString, endString, selectedIds)
      const binary = atob(zipBase64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: "application/zip" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `certificados_${TAB_LABELS[tipo] ?? tipo}_${startString}_${endString}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast({
        title: "Descarga iniciada",
        description: "El archivo ZIP con los PDFs ha sido descargado",
        variant: "success",
      })
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "No se pudieron generar los PDFs",
        variant: "destructive",
      })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Descarga Masiva PDF — {TAB_LABELS[tipo] ?? tipo}
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
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{selectedIds.length} seleccionadas</span>
                <Popover open={popoverClienteOpen} onOpenChange={setPopoverClienteOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs">
                      <UserPlus className="h-3.5 w-3.5 mr-1" />
                      Agregar por cliente
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80">
                    <div className="space-y-2">
                      <Label htmlFor="filtroClienteSedes">Agregar todas las sedes de un cliente</Label>
                      <SelectSingle
                        id="filtroClienteSedes"
                        placeholder="Selecciona un cliente"
                        options={clientes}
                        value={filtroClienteSedes}
                        onChange={(v) => {
                          setFiltroClienteSedes(v)
                          const sedesDelCliente = sedesOptions.filter((s) => String(s.clienteId) === String(v)).map((s) => s.id)
                          if (sedesDelCliente.length === 0) return
                          setSelectedIds((prev) => Array.from(new Set([...prev, ...sedesDelCliente])))
                          setFiltroClienteSedes("")
                          setPopoverClienteOpen(false)
                        }}
                        valueKey="id"
                        labelKey="nombre"
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
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
                  onChange={setSelectedIds}
                  placeholder="Selecciona sedes"
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={downloading}>
            Cancelar
          </Button>
          <Button onClick={handleDownload} disabled={downloading || selectedIds.length === 0} className="bg-primary hover:bg-primary-hover">
            {downloading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Generando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Descargar ZIP
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


