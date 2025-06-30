import { apiService } from "./api";
import type { ApiResponse, Parametrizacion } from "@/types";

export class ParametrizationService {
  async getLista(type: string): Promise<Parametrizacion[]> {
    const response = await apiService.get<ApiResponse<Parametrizacion[]>>(
      `/parametrizaciones/tipo/${type}`
    );

    response.data.forEach((element) => {
      if (element.datosJson) {
        element.datosJson = JSON.parse(element.datosJson);
      }
    });
    return response.data;
  }

  async getListaActivos(type: string): Promise<Parametrizacion[]> {
    const response = await apiService.get<ApiResponse<Parametrizacion[]>>(
      `/parametrizaciones/tipo/${type}/activas`
    );
    return response.data;
  }

  async create(
    type: string,
    periodo: Omit<Parametrizacion, "id">
  ): Promise<Parametrizacion> {
    const response = await apiService.post<ApiResponse<Parametrizacion>>(
      `/parametrizaciones/tipo/${type}`,
      periodo
    );
    return response.data;
  }

  async update(
    type: string,
    id: string,
    periodo: Partial<Parametrizacion>
  ): Promise<Parametrizacion> {
    const response = await apiService.put<ApiResponse<Parametrizacion>>(
      `/parametrizaciones/tipo/${type}/${id}`,
      periodo
    );
    return response.data;
  }

  async toggleStatus(id: string): Promise<Parametrizacion> {
    const response = await apiService.patch<ApiResponse<Parametrizacion>>(
      `/parametrizaciones/${id}/toggle-status`
    );
    return response.data;
  }

  async updateDatosJson(
    id: string,
    user: Partial<Parametrizacion>
  ): Promise<Parametrizacion> {
    const response = await apiService.patch<ApiResponse<Parametrizacion>>(
      `/parametrizaciones/updateDatosJson/${id}`,
      user
    );
    return response.data;
  }
}

export const parametrizationService = new ParametrizationService();
