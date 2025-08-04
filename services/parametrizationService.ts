import { apiService } from "./api";
import type { ApiResponse, Parametrizacion } from "@/types";

export class ParametrizationService {
  async getLista(type: string): Promise<Parametrizacion[]> {
    const response = await apiService.get<ApiResponse<Parametrizacion[]>>(
      `/parametrizaciones/tipo/${type}`
    );

    response.data.forEach((element) => {
      if (element.datosJson && typeof element.datosJson === "string") {
        element.datosJson = JSON.parse(element.datosJson);
      }
    });
    return response.data;
  }

  async getListaActivos(type: string): Promise<Parametrizacion[]> {
    const response = await apiService.get<ApiResponse<Parametrizacion[]>>(
      `/parametrizaciones/tipo/${type}/activas`
    );

    response.data.forEach((element) => {
      if (element.datosJson && typeof element.datosJson === "string") {
        element.datosJson = JSON.parse(element.datosJson);
      }
      element.nombreMostrar = element.codigo ? `[${element.codigo}]-${element.nombre}` : element.nombre;
    });
    return response.data;
  }

  async getListaTResiduosActivos(clienteId: string): Promise<Parametrizacion[]> {
    const response = await apiService.get<ApiResponse<Parametrizacion[]>>(
      `/parametrizaciones/t_residuo/activas/${clienteId}`
    );

    response.data.forEach((element) => {
      if (element.datosJson && typeof element.datosJson === "string") {
        element.datosJson = JSON.parse(element.datosJson);
      }
      element.nombreMostrar = element.codigo ? `[${element.codigo}]-${element.nombre}` : element.nombre;
    });
    return response.data;
  }

  async create(type: string, obj: Partial<Parametrizacion>): Promise<Parametrizacion> {
    obj.datosJson = JSON.stringify(obj.datosJson);
    const response = await apiService.post<ApiResponse<Parametrizacion>>(
      `/parametrizaciones/tipo/${type}`,
      obj
    );
    return response.data;
  }

  async update(type: string, id: string, obj: Partial<Parametrizacion>): Promise<Parametrizacion> {
    obj.datosJson = JSON.stringify(obj.datosJson);
    const response = await apiService.put<ApiResponse<Parametrizacion>>(
      `/parametrizaciones/tipo/${type}/${id}`,
      obj
    );
    return response.data;
  }

  async toggleStatus(id: string): Promise<Parametrizacion> {
    const response = await apiService.patch<ApiResponse<Parametrizacion>>(
      `/parametrizaciones/${id}/toggle-status`
    );
    return response.data;
  }

  async updateDatosJson(id: string, user: Partial<Parametrizacion>): Promise<Parametrizacion> {
    const response = await apiService.patch<ApiResponse<Parametrizacion>>(
      `/parametrizaciones/updateDatosJson/${id}`,
      user
    );
    return response.data;
  }
}

export const parametrizationService = new ParametrizationService();
