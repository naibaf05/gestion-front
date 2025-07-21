import { apiService } from "./api";
import type { ApiResponse, Vehicle } from "@/types";

export class VehicleService {
    async getVehicles(): Promise<Vehicle[]> {
        const response = await apiService.get<ApiResponse<Vehicle[]>>(`/vehicles`);

        response.data.forEach((element) => {
            if (element.datosJson && typeof element.datosJson === "string") {
                element.datosJson = JSON.parse(element.datosJson);
            }
        });
        return response.data;
    }

    async getVehiclesActivos(): Promise<Vehicle[]> {
        const response = await apiService.get<ApiResponse<Vehicle[]>>('/vehicles/activos')
        return response.data
      }

    async createVehicle(vehicle: Partial<Vehicle>): Promise<Vehicle> {
        vehicle.datosJson = JSON.stringify(vehicle.datosJson);
        const response = await apiService.post<ApiResponse<Vehicle>>("/vehicles", vehicle);
        return response.data;
    }

    async updateVehicle(id: string, vehicle: Partial<Vehicle>): Promise<Vehicle> {
        vehicle.datosJson = JSON.stringify(vehicle.datosJson);
        const response = await apiService.put<ApiResponse<Vehicle>>(`/vehicles/${id}`, vehicle);
        return response.data;
    }

    async toggleVehicleStatus(id: string): Promise<Vehicle> {
        const response = await apiService.patch<ApiResponse<Vehicle>>(`/vehicles/${id}/toggle-status`);
        return response.data;
    }
}

export const vehicleService = new VehicleService();
