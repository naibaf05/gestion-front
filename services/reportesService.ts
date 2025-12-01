import { apiService } from "./api";
import type { ApiResponse, GroupedChartResponse, MonthlySedeData, SedeInfo, SedeChart } from "@/types";

export type TipoReporte = "reporte1" | "reporte2" | "reporte3" | "reporte4";

export interface ReporteRequest {
  tipo: TipoReporte;
  fechaInicio: string;
  fechaFin: string;
}

export class ReportesService {
  private sedesCache: Record<string, SedeChart[]> = {}

  async generarReporte(data: ReporteRequest): Promise<any[]> {
    const response = await apiService.post<ApiResponse<any[]>>('/reportes/generar', data);
    return response.data;
  }

  async getStats(): Promise<any> {
    const response = await apiService.get<ApiResponse<any>>(`/reportes/stats`);
    return response.data;
  }

  async getRecentActivities(): Promise<any> {
    const response = await apiService.get<ApiResponse<any>>(`/reportes/recent-activities`);
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

  async asignarFactura(data: any): Promise<any[]> {
    const response = await apiService.post<ApiResponse<any[]>>('/reportes/asignarFactura', data);
    return response.data;
  }

  async getSedes(anio: number, semestre: number, force: boolean = false): Promise<SedeChart[]> {
    const key = `${anio}-${semestre}`
    if (!force && this.sedesCache[key]) {
      return this.sedesCache[key]
    }
    const response = await apiService.get<ApiResponse<SedeChart[]>>(`/reportes/sedes-chart?anio=${anio}&semestre=${semestre}`)
    this.sedesCache[key] = response.data;
    return response.data;
  }

  async getGroupedChartDataByMetric(metric: string, anio: number, semestre: number, force: boolean = false): Promise<GroupedChartResponse> {
    try {
      const sedesRaw = await this.getSedes(anio, semestre, force);

      // Filtrar por sedes con valores > 0 según la métrica seleccionada
      const hasPositiveById = new Set<string>()
      for (const s of sedesRaw) {
        const v = metric === 'visitas'
          ? (s as any).numVisitas
          : metric === 'salidas'
            ? (s as any).numSalidas
            : metric === 'cantidad_kg'
              ? (s as any).numCantidadKg
              : metric === 'cantidad_m3'
                ? (s as any).numCantidadM3
                : 0
        if (s.id && v != null && Number(v) > 0) {
          hasPositiveById.add(s.id)
        }
      }

      const uniqueMap = new Map<string, { id: string; name: string }>()
      for (const s of sedesRaw) {
        if (s.id && hasPositiveById.has(s.id) && !uniqueMap.has(s.id)) {
          uniqueMap.set(s.id, { id: s.id, name: (s as any).nombreSede ?? (s as any).name })
        }
      }
      const uniqueSedes = Array.from(uniqueMap.values())
      const sedeColors = ["#3b82f6", "#f97316", "#22c55e", "#a855f7", "#06b6d4"];
      const sedes: SedeInfo[] = uniqueSedes.map((sede, idx) => ({
        id: sede.id,
        name: sede.name,
        color: sedeColors[idx % sedeColors.length]
      }));

      const allMonths = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
      ];
      const monthsActual = semestre === 1 ? allMonths.slice(0, 6) : allMonths.slice(6, 12)
      const data: MonthlySedeData[] = monthsActual.map(month => {
        const monthData: MonthlySedeData = { month };

        sedes.forEach(sede => {
          const monthIndex = allMonths.indexOf(month) + 1
          monthData[sede.name] = this.getValue(sedesRaw, metric, sede.id, monthIndex);
        });

        return monthData;
      });

      const response = {
        data,
        sedes,
        months: monthsActual
      };
      return response;
    } catch (error) {
      throw new Error('Error al obtener datos del gráfico agrupado');
    }
  }

  getValue(sedes: SedeChart[], metric: string, sedeId: string, month: number) {
    const sedeData = sedes.find(s => s.id === sedeId && s.numeroMes === month);
    if (!sedeData) return 0;
    if (metric === 'visitas') return sedeData.numVisitas;
    if (metric === 'salidas') return sedeData.numSalidas;
    if (metric === 'cantidad_kg') return sedeData.numCantidadKg;
    if (metric === 'cantidad_m3') return sedeData.numCantidadM3;
    return 0;
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
