import { apiService } from './api';

export interface HistorialItem {
  id: number;
  tipo: string;
  registroId: string;
  accion: string;
  observacion: string;
  fecha: string;
  usuario: string;
}

export interface HistorialResponse {
  success: boolean;
  data: HistorialItem[];
  message: string;
  errors: null | any;
}

export const historialService = {
  getHistorial: async (tipo: string, id: string | number): Promise<HistorialResponse> => {
    const response = await apiService.get<HistorialResponse>(`/historial/${tipo}/${id}`);
    return response;
  },
};
