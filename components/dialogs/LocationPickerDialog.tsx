"use client"

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
import { MapPicker } from "@/components/ui/map-picker"
import { MapPin } from "lucide-react"

interface LocationPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  initialLat?: number
  initialLng?: number
  onLocationConfirm: (lat: number, lng: number, address?: string) => void
  readOnly?: boolean
}

export function LocationPickerDialog({
  open,
  onOpenChange,
  title = "Seleccionar Ubicación",
  description = "Haz clic en el mapa o busca una dirección para seleccionar la ubicación",
  initialLat,
  initialLng,
  onLocationConfirm,
  readOnly = false,
}: LocationPickerDialogProps) {
  const [selectedLat, setSelectedLat] = useState<number>(initialLat || 6.2442)
  const [selectedLng, setSelectedLng] = useState<number>(initialLng || -75.5812)
  const [selectedAddress, setSelectedAddress] = useState<string>("")

  useEffect(() => {
    if (initialLat && initialLng) {
      setSelectedLat(initialLat)
      setSelectedLng(initialLng)
    }
  }, [initialLat, initialLng, open])

  const handleLocationSelect = (lat: number, lng: number, address?: string) => {
    setSelectedLat(lat)
    setSelectedLng(lng)
    if (address) {
      setSelectedAddress(address)
    }
  }

  const handleConfirm = () => {
    if (readOnly) {
      onOpenChange(false)
      return
    }
    onLocationConfirm(selectedLat, selectedLng, selectedAddress)
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[950px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{readOnly ? 'Visualización de la ubicación' : description}</DialogDescription>
        </DialogHeader>

        <MapPicker
          initialLat={selectedLat}
          initialLng={selectedLng}
          onLocationSelect={handleLocationSelect}
          height="400px"
          disabled={readOnly}
        />

        {selectedAddress && (
          <div className="bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500"><b>Dirección seleccionada:</b> {selectedAddress}</p>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>
            {readOnly ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!readOnly && (
            <Button type="button" onClick={handleConfirm} className="bg-primary hover:bg-primary-hover">
              Confirmar Ubicación
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
