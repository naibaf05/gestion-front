# gestion-front — Panel Web

Panel de administración web del sistema de gestión. Desarrollado con Next.js 14, TypeScript y Tailwind CSS.

---

## Tecnologías

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Next.js | 14.2.5 | Framework React SSR/SSG |
| TypeScript | 5.5.3 | Tipado estático |
| Tailwind CSS | 3.4.4 | Estilos |
| shadcn/ui + Radix UI | — | Componentes accesibles |
| TanStack Table | 8.10.7 | Tablas con filtros y paginación |
| Recharts | 3.2.1 | Gráficos y estadísticas |
| ExcelJS + XLSX | — | Exportación e importación Excel |
| react-google-recaptcha-v3 | 1.11.0 | Protección de formularios |
| date-fns | 4.1.0 | Manejo de fechas |

---

## Requisitos

- Node.js 18 LTS o superior
- npm 9+

---

## Configuración de variables de entorno

```bash
cp .env.example .env
```

### Variables disponibles

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | URL base del backend | `http://localhost:8080/api` |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Site Key de reCAPTCHA v3 | Obtener en [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin) |

> Para desarrollo se pueden usar las [test keys de Google](https://developers.google.com/recaptcha/docs/faq#id-like-to-run-automated-tests-with-recaptcha.-what-should-i-do) que siempre aprueban.

---

## Correr en desarrollo local

```bash
cd gestion-front
npm install
npm run dev
```

Acceder en: **http://localhost:3000**

---

## Build para producción

```bash
npm run build
npm start
```

---

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo con hot reload |
| `npm run build` | Compilar para producción |
| `npm start` | Ejecutar build de producción |
| `npm run lint` | Verificar errores de linting |
| `npm run type-check` | Verificar tipos TypeScript sin compilar |

---

## Rutas del panel

| Ruta | Descripción | Roles |
|------|-------------|-------|
| `/login` | Inicio de sesión | Todos |
| `/forgot-password` | Recuperar contraseña | Todos |
| `/dashboard` | Panel principal con estadísticas | ADMIN, OPERARIO, CLIENTE |
| `/dashboard/clients` | Gestión de clientes | ADMIN, OPERARIO |
| `/dashboard/sedes` | Gestión de sedes | ADMIN, OPERARIO, CLIENTE |
| `/dashboard/vehicles` | Gestión de vehículos + alertas SOAT/Técnomecanica | ADMIN, OPERARIO |
| `/dashboard/alertas` | Alertas de documentos vencidos | ADMIN, OPERARIO |
| `/dashboard/paths` | Gestión de rutas | ADMIN, OPERARIO |
| `/dashboard/progs` | Programaciones de visitas | ADMIN, OPERARIO |
| `/dashboard/progs-admin` | Administración de programaciones | ADMIN |
| `/dashboard/salidas` | Registro de salidas de vehículos | ADMIN, OPERARIO |
| `/dashboard/certificados` | Gestión de certificados y PDFs | ADMIN, OPERARIO, CLIENTE |
| `/dashboard/cartera` | Gestión de cartera de clientes | ADMIN |
| `/dashboard/reportes` | Reportes generales | ADMIN, OPERARIO |
| `/dashboard/reportes-cli` | Reportes del cliente | CLIENTE |
| `/dashboard/parametrizations` | Parametrizaciones del sistema | ADMIN |
| `/dashboard/users` | Gestión de usuarios | ADMIN |
| `/dashboard/profiles` | Gestión de perfiles/roles | ADMIN |

---

## Build con Docker

```bash
# Desde la raíz del proyecto
docker compose --env-file ./gestion-back/.env.production up -d --build frontend
```

El frontend corre en el puerto **3000** y se accede a través de nginx en producción.
