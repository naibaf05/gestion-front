import { apiService } from "./api"
import type { Cartera, ApiResponse } from "@/types"

export class CarteraService {
  // Obtener datos de cartera
  async getCartera(): Promise<Cartera[]> {
    const response = await apiService.get<ApiResponse<Cartera[]>>(`/clientes/cartera`)
    return response.data
  }

  // Importar datos de cartera (para futuro uso)
  async importarCartera(archivo: File): Promise<void> {
    const formData = new FormData()
    formData.append('file', archivo)

    // Hacer la petición multipart directamente sin usar apiService
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"
    
    const response = await fetch(`${API_BASE_URL}/clientes/importar`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        // No establecer Content-Type para que el navegador lo haga automáticamente con boundary
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
  }
}

export const carteraService = new CarteraService()