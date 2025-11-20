import { init } from "next/dist/compiled/webpack/webpack"

export type ParametrizationType = "poblados" | "oficinas" | "generadores" | "periodos" | "comerciales" | "t_residuos" | "t_clientes" | "und_medidas" | "contenedores" | "t_vehiculos"

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  tokenType: string
  user: User
}

// Tipos de empleados
export interface User {
  id: string
  nombre: string
  apellido: string
  nombreCompleto: string
  documento: string
  telefono: string
  email: string
  rolId: string
  rolNombre?: string
  perfil?: Profile
  activo: boolean
  createdAt: string
  updatedAt: string
  username: string
  permisos?: any
}

export interface Profile {
  id: string
  nombre: string
  descripcion: string
  permisos?: any
  activo: boolean
}

// Tipos de parametrizaciones
export interface Parametrizacion {
  id: string
  nombre: string
  nombreMostrar: string
  codigo?: string
  descripcion?: string
  datosJson?: any
  activo: boolean
}

export interface TipoResiduo {
  id: string
  nombre: string
  nombreMostrar: string
  codigo?: string
  descripcion?: string
  datosJson?: any
  activo: boolean
  tarifa: string
  tarifaNombre: string
  codigoUnidad: string
}

// Tipos de clientes y sedes
export interface Cliente {
  id: string
  nombre: string
  barrio: string
  fechaRenovacion: string
  nit: string
  telefono: string
  direccion: string
  contacto: string
  pobladoId: string
  comercialId: string
  poblado?: Parametrizacion
  comercial?: Parametrizacion
  sedes?: Sede[]
  activo: boolean
  fechaCierreFacturacion?: string
  correo?: string
  correoFacturacion?: string
  tiposClienteIds?: string[]
  datosJson?: any
  tipoCliente?: string
}

export interface Sede {
  id: string
  nombre: string
  clienteId: string
  clienteNombre: string
  barrio: string
  direccion: string
  pobladoId: string
  oficinaId: string[]
  email: string
  telefono: string
  generadorId: string
  periodoId: string
  atencion: number
  cliente?: Cliente
  poblado?: Parametrizacion
  oficina?: Parametrizacion
  generador?: Parametrizacion
  periodo?: Parametrizacion
  activo: boolean
  createdAt: string
  updatedAt: string
  lat?: number
  lon?: number
  frecuencias: any[]
}

// Tipos de configuración
export interface AppConfig {
  primaryColor: string
  logo: string
  companyName: string
  version: string
}

// Tipos de respuesta API
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  errors?: string[]
}

export interface Path {
  id: string
  codigo: string
  nombre: string
  dia: "l" | "m" | "x" | "j" | "v" | "s" | "d" | ""
  oficinaId: string
  activo?: boolean
  diaNombre?: string
  diaColor?: string
}

export interface Vehicle {
  id: string;
  oficinaId: string;
  oficinaNombre?: string;
  interno: string;
  placa: string;
  conductorId: string;
  conductorNombre?: string;
  activo: boolean;
  datosJson?: any
}

export interface AlertaVehiculo {
  id: string;
  placa: string;
  conductorNombre: string;
  fechaSoat?: string;
  fechaTecnomecanica?: string;
}

export interface AlertasCount {
  soat: number;
  tecnomecanica: number;
  total: number;
}

export interface Rate {
  id: string
  sedeId: string
  sedeNombre?: string
  undMedidaId: string
  undMedidaNombre?: string
  tipoResiduoId: string
  tipoResiduoCodigo?: string
  tipoResiduoNombre?: string
  tarifa: string
  tarifaNombre?: string
  fechaInicio: string
  fechaFin?: string
  activo: boolean
  puestoPlanta: boolean
}

export interface ProgPath {
  programacionId: string
  rutaId: string
  rutaNombre: string
  rutaCodigo: string
  planta: string
  vehiculoId: string
  vehiculoInterno: string
  fecha?: string
  fechaFin?: string
}

export interface ProgEvPath {
  id: string
  progId: string
  sedeId: string
  sedeNombre: string
  rutaId: string
  rutaNombre: string
  vehId: string
  vehInterno: string
}

export interface ProgRutas {
  frId: string
  psId: string
  sedeId: string
  sedeNombre: string
  sedeDireccion: string
  sedeBarrio: string
  sedeLat: string
  sedeLon: string
  rutaNombre: string
}

export interface ProgVisitaRecol {
  id: string
  sedeId: string
  sedeNombre: string
  recolId: string
  recolNombre: string
  recolApellido: string
  vehId: string
  vehInterno: string
  novs: string
  visitaRecolId: string
  tipo: string
  tipoNombre?: string
  tipoColor?: string
  inicio: string
  clienteNombre?: string
  // Campos adicionales para soporte de certificados/validaciones
  fecha?: string
  noFactura?: number
  tieneCartera?: number
}

export interface VisitaRecol {
  id: string;
  tipo: string;
  lat: string;
  lon: string;
  fecha: string;
  inicio: string;
  fin: string;
  notas?: string;
  sedeId: string;
  sedeNombre?: string;
  clienteId: string;
  plantaId?: string;
  plantaNombre?: string;
  recolId: string;
  recolNombre?: string;
  recolApellido?: string;
  vehId: string;
  vehInterno?: string;
  tieneFoto?: Boolean;
  numMan?: string;
  comercialId: string;
  comercialNombre?: string;
}

export interface VisitaCantidad {
  id: string;
  cantidad: string;
  cantidadKg?: string;
  tResiduoId: string;
  tResiduoNombre?: string;
  contenedorId: string;
  contenedorNombre?: string;
  numContenedor: string;
  visitaRecolId: string;
  tarifaId: string;
  tarifaNombre?: string;
  unidadMedida?: string;
  cantidadUnidad?: string;
}

export interface InfoAdicional {
  semanaActual: string
}

export interface Permission {
  id: string
  name: string
  category: string
  icon?: any
}

export interface PermissionCategory {
  id: string
  name: string
  icon: any
  permissions: Permission[]
}

// Tipos para certificados
export interface Certificados {
  id: string
  clienteId?: string
  clienteNombre?: string
  sedeId?: string
  sedeNombre?: string
  tipo: string
  fecha: string
  inicio: string
  fin: string
  activo: boolean
  num: string
  notas?: string
  noFactura?: number
  tieneCartera?: number
}

// Tipos para salidas
export interface Salida {
  id: string
  plantaId: string
  plantaNombre?: string
  clienteId: string
  clienteNombre?: string
  vehiculoId: string
  vehiculoPlaca?: string
  conductorId: string
  conductorNombre?: string
  productoId: string
  productoNombre?: string
  peso: number
  fecha: string
  activo: boolean
  createdAt: string
  updatedAt: string
  sede?: Sede
  conductor?: User
  producto?: Parametrizacion
}

// Tipos para Dashboard Stats
export interface DashboardStatItem {
  title: string
  value: string | number
  description: string
}

export interface DashboardStats {
  empleados: DashboardStatItem
  clientes: DashboardStatItem
  sedes: DashboardStatItem
  parametrizaciones: DashboardStatItem
}

// Tipo para la respuesta del backend (números directos)
export interface DashboardStatsResponse {
  empleados: number
  clientes: number
  sedes: number
  parametrizaciones: number
}

// Tipos para gráficos
export interface ChartDataPoint {
  name: string
  value: number
  [key: string]: string | number
}

export interface ChartConfig {
  xAxisKey: string
  yAxisKey: string
  title: string
  xAxisLabel?: string
  yAxisLabel?: string
  color?: string
}

export interface SedeChartData {
  sede: string
  empleados: number
  clientes: number
  vehiculos: number
  certificados: number
}

export interface ChartResponse {
  data: ChartDataPoint[]
  total: number
}

// Tipos para gráficos agrupados por mes y sede
export interface MonthlySedeData {
  month: string // Ej: "Enero", "Febrero", etc.
  [sedeName: string]: number | string // Cada sede será una propiedad con su valor
}

export interface SedeInfo {
  id: string
  name: string
  color: string
}

export interface GroupedChartResponse {
  data: MonthlySedeData[]
  sedes: SedeInfo[]
  months: string[]
}

export interface Cartera {
  id: string
  clienteId: string
  clienteNombre: string
  clienteNit: string
  documento: string
  createdAt?: string
  updatedAt?: string
}

export interface Adjunto {
  id: string
  nombre: string
  tipo: string // Tipo de entidad (ej: "progs", "clientes", etc.)
  relacionId: string // ID de la entidad relacionada
  ruta: string
  base64?: string
  tipoArchivo?: string
}
