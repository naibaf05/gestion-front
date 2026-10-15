"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileWarning, Download, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { visitService } from "@/services/visitService"
import { SelectSingle } from "@/components/ui/select-single"
import type { Sede } from "@/types"

interface CargueMasivoVisitasDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sedes: Sede[]
  onSuccess: () => void
}

const COLUMNAS = [
  { nombre: "FECHA", obligatoria: true },
  { nombre: "HORAINICIO", obligatoria: true },
  { nombre: "HORAFIN", obligatoria: false },
  { nombre: "TIPOVISITA", obligatoria: true },
  { nombre: "SEDE", obligatoria: true },
  { nombre: "CONDUCTOR", obligatoria: true },
  { nombre: "RECEPTOR", obligatoria: true },
  { nombre: "COMERCIAL", obligatoria: true },
  { nombre: "VEHICULO", obligatoria: false },
  { nombre: "PLANTA", obligatoria: false },
  { nombre: "NOTAS", obligatoria: false },
  { nombre: "TIPORESIDUO", obligatoria: true },
  { nombre: "CANTIDAD", obligatoria: true },
  { nombre: "CONTENEDOR", obligatoria: false },
  { nombre: "NUMCONTENEDOR", obligatoria: false },
  { nombre: "NUMFACTURA", obligatoria: false },
  { nombre: "FECHAFACTURA", obligatoria: false },
]

export function CargueMasivoVisitasDialog({ open, onOpenChange, sedes, onSuccess }: CargueMasivoVisitasDialogProps) {
  const { toast } = useToast()
  const [archivo, setArchivo] = useState<File | null>(null)
  const [cargando, setCargando] = useState(false)
  const [sedeEjemploId, setSedeEjemploId] = useState("")
  const [descargandoEjemplo, setDescargandoEjemplo] = useState(false)
  const [duplicadosPendientes, setDuplicadosPendientes] = useState<string[] | null>(null)

  const handleClose = (nextOpen: boolean) => {
    if (!cargando) {
      setArchivo(null)
      setDuplicadosPendientes(null)
      onOpenChange(nextOpen)
    }
  }

  const descargarBase64 = (base64: string, nombreArchivo: string, tipo: string) => {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    const blob = new Blob([bytes], { type: tipo })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = nombreArchivo
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const descargarErrores = (errores: { fila: number; errores: string[] }[]) => {
    const lineas = errores.map(e => `Fila ${e.fila}: ${e.errores.join(" | ")}`)
    const contenido = lineas.join("\r\n")
    const blob = new Blob([contenido], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `errores_cargue_visitas_${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleDescargarEjemplo = async () => {
    setDescargandoEjemplo(true)
    try {
      const base64 = await visitService.descargarPlantillaEjemplo(sedeEjemploId || undefined)
      descargarBase64(base64, "ejemplo_cargue_visitas.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      toast({ title: "Ejemplo descargado", description: "Se generó el archivo con datos reales de tu sistema", variant: "success" })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "No se pudo generar el ejemplo",
        variant: "error",
      })
    } finally {
      setDescargandoEjemplo(false)
    }
  }

  const handleUpload = async (opciones?: { confirmarDuplicados?: boolean; omitirDuplicados?: boolean }) => {
    if (!archivo) {
      toast({ title: "Selecciona un archivo", description: "Debes seleccionar un archivo .xlsx", variant: "warning" })
      return
    }
    setCargando(true)
    try {
      const resultado = await visitService.cargueMasivo(archivo, opciones)
      if (resultado.requiereConfirmacionDuplicados) {
        setDuplicadosPendientes(resultado.duplicados || [])
        return
      }
      setDuplicadosPendientes(null)
      if (resultado.exito) {
        toast({
          title: "Cargue exitoso",
          description: `Se crearon ${resultado.creadas} visita(s) correctamente`,
          variant: "success",
        })
        setArchivo(null)
        onSuccess()
        onOpenChange(false)
      } else {
        descargarErrores(resultado.errores)
        toast({
          title: "No se creó ninguna visita",
          description: `Se encontraron ${resultado.errores.length} fila(s) con errores. Se descargó un archivo .txt con el detalle.`,
          variant: "error",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "No se pudo procesar el archivo",
        variant: "error",
      })
    } finally {
      setCargando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Cargue Masivo de Recolecciones
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            <FileWarning className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              Las filas que comparten Fecha + HoraInicio + Sede se agrupan como una sola visita (cada fila es un
              residuo/cantidad de esa visita). Si alguna fila del archivo tiene un error, no se creará ninguna
              visita. En ese caso se descargará automáticamente un archivo .txt con el número de fila y el detalle
              del error.
            </span>
          </div>

          <div className="space-y-2">
            <Label>Columnas del archivo</Label>
            <div className="flex flex-wrap gap-1.5">
              {COLUMNAS.map(col => (
                <span
                  key={col.nombre}
                  className={`text-xs px-2 py-1 rounded-full border ${col.obligatoria
                    ? "bg-rose-50 text-rose-700 border-rose-300"
                    : "bg-gray-100 text-gray-600 border-gray-300"
                    }`}
                >
                  {col.nombre}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded-full bg-rose-200 border border-rose-300" /> Obligatoria
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded-full bg-gray-200 border border-gray-300" /> Opcional
              </span>
            </div>
          </div>

          <div className="rounded-md border p-3 space-y-2">
            <Label>Descargar ejemplo con datos reales</Label>
            <p className="text-xs text-muted-foreground">
              Elige una sede (opcional) para generar un .xlsx de ejemplo usando esa sede, un tipo de residuo con
              tarifa vigente, y un conductor/receptor/comercial reales de tu sistema.
            </p>
            <div className="flex gap-2">
              <div className="flex-1">
                <SelectSingle
                  id="sedeEjemplo"
                  placeholder="Cualquier sede activa"
                  options={sedes}
                  value={sedeEjemploId}
                  onChange={setSedeEjemploId}
                  valueKey="id"
                  labelKey="nombre"
                />
              </div>
              <Button type="button" variant="outline" onClick={handleDescargarEjemplo} disabled={descargandoEjemplo}>
                {descargandoEjemplo ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Descargar ejemplo
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="archivo">Archivo (.xlsx)</Label>
            <Input
              id="archivo"
              type="file"
              accept=".xlsx"
              disabled={cargando}
              onChange={(e) => setArchivo(e.target.files?.[0] || null)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={cargando}>
            Cancelar
          </Button>
          <Button onClick={() => handleUpload()} disabled={cargando || !archivo} className="bg-primary hover:bg-primary-hover">
            {cargando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Procesando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Cargar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      <Dialog open={!!duplicadosPendientes} onOpenChange={(o) => { if (!o && !cargando) setDuplicadosPendientes(null) }}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
              Posibles registros duplicados
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground shrink-0">
            Encontramos filas con el mismo Día, Hora, Sede y Cantidad, ya sea repetidas dentro del
            archivo o porque ya existen guardadas en la base de datos. ¿Quieres crearlas de todas
            formas o prefieres omitir los repetidos (se conserva solo la primera fila de cada
            grupo; los que ya existen en la base de datos se omiten por completo)?
            {duplicadosPendientes && duplicadosPendientes.length > 0 && (
              <span className="font-medium"> ({duplicadosPendientes.length} grupo{duplicadosPendientes.length === 1 ? "" : "s"} encontrado{duplicadosPendientes.length === 1 ? "" : "s"})</span>
            )}
          </p>
          <div className="flex-1 min-h-0 overflow-y-auto border rounded-md">
            <ul className="text-sm list-disc pl-5 pr-3 py-2 space-y-1.5">
              {(duplicadosPendientes || []).map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 shrink-0">
            <Button variant="outline" onClick={() => setDuplicadosPendientes(null)} disabled={cargando}>
              Cancelar
            </Button>
            <Button variant="outline" onClick={() => handleUpload({ omitirDuplicados: true })} disabled={cargando}>
              Omitir duplicados
            </Button>
            <Button onClick={() => handleUpload({ confirmarDuplicados: true })} disabled={cargando} className="bg-primary hover:bg-primary-hover">
              Crear de todas formas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
