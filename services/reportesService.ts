import { apiService } from "./api";
import type { ApiResponse, ChartResponse, SedeChartData, GroupedChartResponse, MonthlySedeData, SedeInfo } from "@/types";

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

  async getStats(): Promise<any> {
    const response = await apiService.get<ApiResponse<any>>(`/reportes/stats`);
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

  async getSedeChartData(): Promise<SedeChartData[]> {
    // Simulamos datos para el gráfico por ahora
    // En producción, esto haría una llamada al backend
    return [
      { sede: "Sede Norte", empleados: 45, clientes: 120, vehiculos: 15, certificados: 89 },
      { sede: "Sede Sur", empleados: 38, clientes: 95, vehiculos: 12, certificados: 67 },
      { sede: "Sede Este", empleados: 52, clientes: 140, vehiculos: 18, certificados: 102 },
      { sede: "Sede Oeste", empleados: 41, clientes: 110, vehiculos: 14, certificados: 78 },
      { sede: "Sede Central", empleados: 62, clientes: 180, vehiculos: 22, certificados: 134 }
    ];
  }

  async getGroupedChartDataByMetric(metric: string): Promise<GroupedChartResponse> {
    try {
      // En el futuro, esto podría ser una llamada real al backend
      // const response = await apiService.get<ApiResponse<GroupedChartResponse>>(`/reportes/charts/grouped/${metric}`);
      
      // Simulamos datos agrupados por mes y sede
      const sedes: SedeInfo[] = [
        { id: "sede1", name: "Sede Norte", color: "#3b82f6" },
        { id: "sede2", name: "Sede Sur", color: "#f97316" },
        { id: "sede3", name: "Sede Este", color: "#22c55e" },
        { id: "sede4", name: "Sede Oeste", color: "#a855f7" },
        { id: "sede5", name: "Sede Central", color: "#06b6d4" }
      ];

      const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
      ];

      // Generar datos simulados para cada mes
      const data: MonthlySedeData[] = months.slice(0, 6).map(month => {
        const monthData: MonthlySedeData = { month };
        
        sedes.forEach(sede => {
          // Generar valores aleatorios basados en la métrica
          const baseValue = {
            empleados: Math.floor(Math.random() * 50) + 30,
            clientes: Math.floor(Math.random() * 100) + 80,
            vehiculos: Math.floor(Math.random() * 20) + 10,
            certificados: Math.floor(Math.random() * 80) + 50
          };
          
          monthData[sede.name] = baseValue[metric as keyof typeof baseValue] || 0;
        });
        
        return monthData;
      });

      return {
        data,
        sedes,
        months: months.slice(0, 6)
      };
    } catch (error) {
      throw new Error('Error al obtener datos del gráfico agrupado');
    }
  }

  async getChartDataByMetric(metric: string): Promise<ChartResponse> {
    try {
      // En el futuro, esto podría ser una llamada real al backend
      // const response = await apiService.get<ApiResponse<ChartResponse>>(`/reportes/charts/${metric}`);
      
      // Por ahora simulamos la respuesta
      const sedeData = await this.getSedeChartData();
      const data = sedeData.map(item => ({
        name: item.sede,
        value: item[metric as keyof Omit<SedeChartData, 'sede'>] || 0
      }));
      
      return {
        data,
        total: data.reduce((sum, item) => sum + item.value, 0)
      };
    } catch (error) {
      throw new Error('Error al obtener datos del gráfico');
    }
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
