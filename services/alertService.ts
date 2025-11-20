import { apiService } from "./api";
import type { ApiResponse, AlertaVehiculo, AlertasCount } from "@/types";

export class AlertService {
    // Obtener alertas de SOAT
    async getAlertasSoat(): Promise<AlertaVehiculo[]> {
        const response = await apiService.get<ApiResponse<AlertaVehiculo[]>>("/alertas/soat");
        return response.data;
    }

    // Obtener alertas de Tecnomecánica
    async getAlertasTecnomecanica(): Promise<AlertaVehiculo[]> {
        const response = await apiService.get<ApiResponse<AlertaVehiculo[]>>("/alertas/tecnomecanica");
        return response.data;
    }

    // Obtener contador de alertas
    async getAlertasCount(): Promise<AlertasCount> {
        const response = await apiService.get<ApiResponse<AlertasCount>>("/alertas/count");
        return response.data;
    }

    // Actualizar fecha de SOAT
    async updateFechaSoat(vehiculoId: string, fechaSoat: string): Promise<void> {
        await apiService.patch<ApiResponse<void>>(`/vehicles/soat/${vehiculoId}`, { fechaSoat });
    }

    // Actualizar fecha de Tecnomecánica
    async updateFechaTecnomecanica(vehiculoId: string, fechaTecnomecanica: string): Promise<void> {
        await apiService.patch<ApiResponse<void>>(`/vehicles/tecnomecanica/${vehiculoId}`, { fechaTecnomecanica });
    }
}

export const alertService = new AlertService();
