"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Search, Crosshair } from "lucide-react"

// Tipos para evitar errores de TypeScript
declare global {
  interface Window {
    L: any
  }
}

interface MapPickerProps {
  initialLat?: number
  initialLng?: number
  onLocationSelect: (lat: number, lng: number, address?: string) => void
  height?: string
  className?: string
}

export function MapPicker({
  initialLat = 6.2442, // Medellín por defecto
  initialLng = -75.5812,
  onLocationSelect,
  height = "400px",
  className = "",
}: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [searchAddress, setSearchAddress] = useState("")
  const [currentLat, setCurrentLat] = useState(initialLat)
  const [currentLng, setCurrentLng] = useState(initialLng)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    // Cargar Leaflet dinámicamente
    const loadLeaflet = async () => {
      if (typeof window !== "undefined" && !window.L) {
        // Cargar CSS
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)

        // Cargar JS
        const script = document.createElement("script")
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        script.onload = () => {
          setIsLoaded(true)
        }
        document.head.appendChild(script)
      } else if (window.L) {
        setIsLoaded(true)
      }
    }

    loadLeaflet()
  }, [])

  useEffect(() => {
    if (isLoaded && mapRef.current && !mapInstanceRef.current) {
      // Inicializar el mapa
      mapInstanceRef.current = window.L.map(mapRef.current).setView([currentLat, currentLng], 13)

      // Agregar tiles de OpenStreetMap
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapInstanceRef.current)

      // Agregar marcador inicial
      markerRef.current = window.L.marker([currentLat, currentLng], {
        draggable: true,
      }).addTo(mapInstanceRef.current)

      // Evento cuando se arrastra el marcador
      markerRef.current.on("dragend", (e: any) => {
        const position = e.target.getLatLng()
        setCurrentLat(position.lat)
        setCurrentLng(position.lng)
        onLocationSelect(position.lat, position.lng)
        reverseGeocode(position.lat, position.lng)
      })

      // Evento cuando se hace clic en el mapa
      mapInstanceRef.current.on("click", (e: any) => {
        const { lat, lng } = e.latlng
        setCurrentLat(lat)
        setCurrentLng(lng)
        markerRef.current.setLatLng([lat, lng])
        onLocationSelect(lat, lng)
        reverseGeocode(lat, lng)
      })
    }
  }, [isLoaded, currentLat, currentLng, onLocationSelect])

  // Geocodificación inversa para obtener la dirección
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      )
      const data = await response.json()
      if (data.display_name) {
        onLocationSelect(lat, lng, data.display_name)
      }
    } catch (error) {
      console.error("Error en geocodificación inversa:", error)
    }
  }

  // Búsqueda de direcciones
  const searchLocation = async () => {
    if (!searchAddress.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=1&countrycodes=co`,
      )
      const data = await response.json()

      if (data.length > 0) {
        const { lat, lon } = data[0]
        const newLat = Number.parseFloat(lat)
        const newLng = Number.parseFloat(lon)

        setCurrentLat(newLat)
        setCurrentLng(newLng)

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([newLat, newLng], 15)
          markerRef.current.setLatLng([newLat, newLng])
        }

        onLocationSelect(newLat, newLng, data[0].display_name)
      }
    } catch (error) {
      console.error("Error en búsqueda:", error)
    } finally {
      setIsSearching(false)
    }
  }

  // Obtener ubicación actual del usuario
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setCurrentLat(latitude)
          setCurrentLng(longitude)

          if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.setView([latitude, longitude], 15)
            markerRef.current.setLatLng([latitude, longitude])
          }

          onLocationSelect(latitude, longitude)
          reverseGeocode(latitude, longitude)
        },
        (error) => {
          console.error("Error obteniendo ubicación:", error)
        },
      )
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      searchLocation()
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Controles de búsqueda */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="search">Buscar dirección</Label>
          <div className="flex gap-2">
            <Input
              id="search"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ingresa una dirección..."
              className="flex-1"
            />
            <Button type="button" onClick={searchLocation} disabled={isSearching} variant="outline">
              {isSearching ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <div className="flex flex-col justify-end">
          <Button type="button" onClick={getCurrentLocation} variant="outline" title="Usar mi ubicación actual">
            <Crosshair className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Latitud</Label>
            <Input value={currentLat.toFixed(6)} readOnly className="bg-gray-50" />
          </div>
          <div>
            <Label>Longitud</Label>
            <Input value={currentLng.toFixed(6)} readOnly className="bg-gray-50" />
          </div>
        </div>
      </div>

      {/* Mapa */}
      <div className="relative border rounded-lg overflow-hidden">
        {!isLoaded && (
          <div className="flex items-center justify-center bg-gray-100" style={{ height }}>
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Cargando mapa...</p>
            </div>
          </div>
        )}
        <div ref={mapRef} style={{ height, width: "100%" }} className={!isLoaded ? "hidden" : ""} />

        {/* Instrucciones */}
        <div className="absolute top-2 left-2 bg-white bg-opacity-90 p-2 rounded shadow text-xs">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>Haz clic o arrastra el marcador</span>
          </div>
        </div>
      </div>
    </div>
  )
}
