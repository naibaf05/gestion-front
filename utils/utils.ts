import type { Parametrizacion, User } from "@/types"

const DIAS_SEMANA = {
    l: "Lunes",
    m: "Martes",
    x: "Miércoles",
    j: "Jueves",
    v: "Viernes",
    s: "Sábado",
    d: "Domingo",
}

const DIAS_COLORS = {
    l: "new-bg-blue-100 new-text-blue-800",
    m: "new-bg-green-100 new-text-green-800",
    x: "new-bg-yellow-100 new-text-yellow-800",
    j: "new-bg-purple-100 new-text-purple-800",
    v: "new-bg-pink-100 new-text-pink-800",
    s: "new-bg-indigo-100 new-text-indigo-800",
    d: "new-bg-red-100 new-text-red-800",
}

const TIPO_VISITAS = {
    ruta: "Ruta",
    eventual: "Eventual",
    puesto: "Puesto en planta",
}

const TIPO_COLOR = {
    ruta: "new-bg-blue-100 new-text-blue-800",
    eventual: "new-bg-red-100 new-text-red-800",
    puesto: "new-bg-green-100 new-text-green-800",
}

export type DiaKey = keyof typeof DIAS_SEMANA;
export type TipoVisitaKey = keyof typeof TIPO_VISITAS;

export function getDiaSemana(dia: DiaKey) {
    return DIAS_SEMANA[dia];
}

export function getDiaColor(dia: DiaKey) {
    return DIAS_COLORS[dia];
}

export function getTipoVisita(tipo: TipoVisitaKey) {
    return TIPO_VISITAS[tipo];
}

export function getTipoColor(tipo: TipoVisitaKey) {
    return TIPO_COLOR[tipo];
}

/**
 * Filtra la lista de plantas según las plantas asignadas al usuario.
 * Si el usuario no tiene plantas asignadas (null o vacío) devuelve todas.
 */
export function filterPlantasByUser(plantas: Parametrizacion[], user: User | null): Parametrizacion[] {
    if (!user?.plantasIds || user.plantasIds.length === 0) return plantas;
    const ids = user.plantasIds.map(String);
    return plantas.filter(p => ids.includes(String(p.id)));
}

/**
 * Verifica si un ID de planta individual está dentro de las plantas permitidas del usuario.
 * Si el usuario no tiene restricción de plantas, devuelve true.
 * Si el ID de planta es null/undefined (registro sin planta), devuelve true.
 */
export function matchesUserPlantas(plantaId: string | number | null | undefined, user: User | null): boolean {
    if (!user?.plantasIds || user.plantasIds.length === 0) return true;
    if (plantaId == null) return true;
    return user.plantasIds.map(String).includes(String(plantaId));
}

/**
 * Verifica si al menos uno de los IDs en un array de plantas está en las plantas del usuario.
 * Si el usuario no tiene restricción, devuelve true.
 * Si el array es vacío/null, devuelve true.
 */
export function matchesUserPlantasArray(ids: (string | number)[] | null | undefined, user: User | null): boolean {
    if (!user?.plantasIds || user.plantasIds.length === 0) return true;
    if (!ids || ids.length === 0) return true;
    const allowed = user.plantasIds.map(String);
    return ids.some(id => allowed.includes(String(id)));
}
