import { apiService } from "./api"
import type { Adjunto, ApiResponse } from "@/types"

export class AdjuntosService {
  // Obtener adjuntos por tipo y entityId
  async getAdjuntos(tipo: string, entityId: string): Promise<Adjunto[]> {
    const response = await apiService.get<ApiResponse<Adjunto[]>>(`/adjuntos/${tipo}/${entityId}`)
    return response.data
  }

  // Subir un nuevo adjunto
  async uploadAdjunto(archivo: File, tipo: string, entityId: string): Promise<Adjunto> {
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
      const errorData = await response.json()
      throw errorData
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