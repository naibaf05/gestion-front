import { apiService } from "./api"
import type { Adjunto, ApiResponse } from "@/types"

export class AdjuntosService {
  // Obtener adjuntos por tipo y entityId
  async getAdjuntos(tipo: string, entityId: string): Promise<Adjunto[]> {
    const response = await apiService.get<ApiResponse<Adjunto[]>>(`/adjuntos/${tipo}/${entityId}`)
    return response.data
  }

  // Obtener adjuntos por tipo y entityId con ftp
  async getAdjuntosFtp(tipo: string, entityId: string): Promise<Adjunto[]> {
    const response = await apiService.get<ApiResponse<Adjunto[]>>(`/adjuntos/ftp/${tipo}/${entityId}`)
    return response.data
  }

  // Obtener el contenido (base64) de un archivo del FTP a partir de su ruta
  async getByRuta(ruta: string): Promise<Adjunto> {
    const response = await apiService.get<ApiResponse<Adjunto>>(`/adjuntos/ftp?ruta=${encodeURIComponent(ruta)}`)
    return response.data
  }

  // Subir un nuevo adjunto
  async uploadAdjunto(archivo: File, tipo: string, entityId: string): Promise<Adjunto> {
    const MAX_SIZE_MB = 10
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

    if (archivo.size > MAX_SIZE_BYTES) {
      throw new Error(`El archivo supera el límite de ${MAX_SIZE_MB} MB. Tamaño actual: ${(archivo.size / 1024 / 1024).toFixed(2)} MB.`)
    }

    const formData = new FormData()
    formData.append('file', archivo)
    formData.append('tipo', tipo)
    formData.append('relacionId', entityId)

    // Hacer la petición multipart directamente
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"
    
    const response = await fetch(`${API_BASE_URL}/adjuntos/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData
    })

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token")
          window.location.href = "/login"
        }
      }

      if (response.status === 413) {
        throw new Error(`El archivo es demasiado grande para el servidor. El límite permitido es ${MAX_SIZE_MB} MB.`)
      }

      // Intentar leer el cuerpo como JSON; si falla, usar mensaje genérico
      const contentType = response.headers.get("content-type") ?? ""
      if (contentType.includes("application/json")) {
        const errorData = await response.json()
        throw new Error(errorData?.message || "No se pudo subir el archivo")
      }

      throw new Error(`Error al subir el archivo (código ${response.status})`)
    }

    const result = await response.json()
    return result.data
  }

  // Eliminar adjunto
  async deleteAdjunto(id: string): Promise<void> {
    await apiService.delete(`/adjuntos/${id}`)
  }

  // Obtener URL para visualizar adjunto
  async getView(id: string): Promise<Adjunto> {
    const response = await apiService.get<ApiResponse<Adjunto>>(`/adjuntos/${id}`)
    return response.data
  }

  // Obtener URL para descargar adjunto
  getDownloadUrl(id: string): string {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    return `${API_BASE_URL}/adjuntos/download/${id}${token ? `?token=${token}` : ''}`
  }
}

export const adjuntosService = new AdjuntosService()