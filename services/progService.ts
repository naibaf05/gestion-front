import { getTipoColor, getTipoVisita, TipoVisitaKey } from "@/utils/utils"
import { apiService } from "./api"
import type { ApiResponse, ProgEvPath, ProgPath, ProgRutas, ProgVisitaRecol } from "@/types"

export class ProgService {
  async getData(fecha: string, semanal: boolean): Promise<ProgPath[]> {
    const response = await apiService.get<ApiResponse<ProgPath[]>>(`/progs?fecha=${fecha}&semanal=${semanal}`)
    return response.data
  }

  async update(ruta: Partial<ProgPath>): Promise<ProgPath> {
    const response = await apiService.put<ApiResponse<ProgPath>>(`/progs`, ruta)
    return response.data
  }

  async getDataEv(fecha: string, semanal: boolean): Promise<ProgEvPath[]> {
    const response = await apiService.get<ApiResponse<ProgEvPath[]>>(`/progs/eventuales?fecha=${fecha}&semanal=${semanal}`)
    return response.data
  }

  async getDataRutas(fecha: string, rutaId: string): Promise<ProgRutas[]> {
    const response = await apiService.get<ApiResponse<ProgRutas[]>>(`/progs/rutas?fecha=${fecha}&rutaId=${rutaId}`)
    return response.data
  }

  async getDataProgsAdmin(inicio: string, fin: string): Promise<ProgVisitaRecol[]> {
    const response = await apiService.get<ApiResponse<ProgVisitaRecol[]>>(`/progs/progs-admin?inicio=${inicio}&fin=${fin}`)

    response.data.forEach(obj => {
      const tipo = obj.tipo as TipoVisitaKey
      obj.tipoNombre = getTipoVisita(tipo);
      obj.tipoColor = getTipoColor(tipo);
    });
    console.log(response.data);
    return response.data
  }

  async createEv(fecha: string, ruta: Partial<ProgEvPath>): Promise<ProgEvPath> {
    const response = await apiService.post<ApiResponse<ProgEvPath>>(`/progs?fecha=${fecha}`, ruta)
    return response.data
  }

  async deleteEv(id: string): Promise<ProgEvPath> {
    const response = await apiService.delete<ApiResponse<ProgEvPath>>(`/progs/${id}`)
    return response.data
  }

  async deleteVisita(id: string): Promise<ProgEvPath> {
    const response = await apiService.delete<ApiResponse<ProgEvPath>>(`/progs/visita/${id}`)
    return response.data
  }
}

export const progService = new ProgService()