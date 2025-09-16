import { apiService } from "./api";
import type { ApiResponse } from "@/types";

export type TipoReporte = "reporte1" | "reporte2" | "reporte3" | "reporte4";

export interface ReporteRequest {
  tipo: TipoReporte;
  fechaInicio: string;
  fechaFin: string;
}

export class ReportesService {
  async generarReporte(data: ReporteRequest): Promise<any[]> {
    const response = await apiService.post<ApiResponse<any[]>>('/reportes/generar', data);
    return response.data;
  }

  async generarReporte1(fechaInicio: string, fechaFin: string): Promise<any[]> {
    const response = await apiService.get<ApiResponse<any[]>>(`/reportes/reporte1?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
    return response.data;
  }

  async generarReporte2(fechaInicio: string, fechaFin: string): Promise<any[]> {
    const response = await apiService.get<ApiResponse<any[]>>(`/reportes/reporte2?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
    return response.data;
  }

  async generarReporte3(fechaInicio: string, fechaFin: string): Promise<any[]> {
    const response = await apiService.get<ApiResponse<any[]>>(`/reportes/reporte3?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
    return response.data;
  }

  async generarReporte4(fechaInicio: string, fechaFin: string): Promise<any[]> {
    const response = await apiService.get<ApiResponse<any[]>>(`/reportes/reporte4?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
    return response.data;
  }

  async descargarReportePDF(base64Data: string, filename: string): Promise<void> {
    try {
      // Crear un blob desde el base64
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      // Crear un link de descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error('Error al descargar el archivo PDF');
    }
  }
}

export const reportesService = new ReportesService();
