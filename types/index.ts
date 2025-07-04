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
  createdAt: string
  updatedAt: string
}

export interface Sede {
  id: string
  nombre: string
  clienteId: string
  barrio: string
  direccion: string
  pobladoId: string
  oficinaId: string
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

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface Path {
  id: string
  codigo?: string
  nombre: string
  dia?: "l" | "m" | "x" | "j" | "v" | "s" | "d" | ""
  oficinaId?: string
  tResiduoId?: string
  activo?: boolean
}
