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
