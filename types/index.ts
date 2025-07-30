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
  codigo?: string
  descripcion?: string
  datosJson?: any
  activo: boolean
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

export interface Rate {
  id: string
  sedeId: string
  sedeNombre?: string
  undMedidaId: string
  undMedidaNombre?: string
  tipoResiduoId: string
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
  tResiduoId: string;
  tResiduoNombre?: string;
  contenedorId: string;
  contenedorNombre?: string;
  numContenedor: string;
  visitaRecolId: string;
  tarifaId: string;
  tarifaNombre?: string;
}

export interface InfoAdicional {
  semanaActual: string
}
