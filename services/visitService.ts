import { apiService } from "./api";
import type { ApiResponse, CargueVisitasResponse, VisitaCantidad, VisitaRecol } from "@/types";

export class VisitService {
    async descargarPlantillaEjemplo(sedeId?: string): Promise<string> {
        const query = sedeId ? `?sedeId=${sedeId}` : "";
        const response = await apiService.get<ApiResponse<string>>(`/visitas/cargue-masivo/plantilla${query}`);
        return response.data;
    }

    async cargueMasivo(archivo: File, opciones?: { confirmarDuplicados?: boolean; omitirDuplicados?: boolean }): Promise<CargueVisitasResponse> {
        const formData = new FormData();
        formData.append("file", archivo);

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

        const params = new URLSearchParams();
        if (opciones?.confirmarDuplicados) params.set("confirmarDuplicados", "true");
        if (opciones?.omitirDuplicados) params.set("omitirDuplicados", "true");
        const query = params.toString() ? `?${params.toString()}` : "";

        const response = await fetch(`${API_BASE_URL}/visitas/cargue-masivo${query}`, {
            method: "POST",
            headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: formData,
        });

        const data: ApiResponse<CargueVisitasResponse> = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || "No se pudo procesar el archivo");
        }
        return data.data;
    }
    
    async create(obj: Partial<VisitaRecol>): Promise<ApiResponse<VisitaRecol>> {
        const response = await apiService.post<ApiResponse<VisitaRecol>>("/visitas", obj);
        return response;
    }

    async update(id: string, obj: Partial<VisitaRecol>): Promise<ApiResponse<VisitaRecol>> {
        const response = await apiService.put<ApiResponse<VisitaRecol>>(`/visitas/${id}`, obj);
        return response;
    }

    async updateFirma(id: string, firma: string): Promise<void> {
        await apiService.patch<ApiResponse<void>>(`/visitas/${id}/firma`, { firma });
    }

    async getId(id: string): Promise<VisitaRecol> {
        const response = await apiService.get<ApiResponse<VisitaRecol>>(`/visitas/${id}`);
        return response.data;
    }

    async createCantidad(obj: Partial<VisitaCantidad>): Promise<VisitaCantidad> {
        const response = await apiService.post<ApiResponse<VisitaCantidad>>("/visitas/cantidades", obj);
        return response.data;
    }

    async updateCantidad(id: string, obj: Partial<VisitaCantidad>): Promise<VisitaCantidad> {
        const response = await apiService.put<ApiResponse<VisitaCantidad>>(`/visitas/cantidades/${id}`, obj);
        return response.data;
    }

    async getCantidades(visitaRecolId: string): Promise<VisitaCantidad[]> {
        const response = await apiService.get<ApiResponse<VisitaCantidad[]>>(`/visitas/cantidades/${visitaRecolId}`);
        for (const cantidad of response.data) {
            if (cantidad.unidadMedida) {
                cantidad.cantidadUnidad = cantidad.cantidad + " " + cantidad.unidadMedida;
            } else {
                cantidad.cantidadUnidad = cantidad.cantidad;
            }
        }
        return response.data;
    }

    async deleteCantidad(id: string): Promise<void> {
        await apiService.delete(`/visitas/cantidades/${id}`);
    }
}

export const visitService = new VisitService();
