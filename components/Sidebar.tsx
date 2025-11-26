"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useConfig } from "@/contexts/ConfigContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Users, Building2, Settings, Home, UserCheck, MapPin, LogOut, Menu, X, ChevronDown, ChevronRight, Route, FolderCog, Car, CalendarSearch, CalendarRange, ShieldCheck, FolderDown, FileCode, CircleDollarSign, Bell } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { alertService } from "@/services/alertService"

interface MenuItem {
  title: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  children?: MenuItem[]
  requiredRole?: string
  requiredPermission?: string // Nueva propiedad para el permiso requerido
}

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "General",
    icon: FolderCog,
    children: [
      {
        title: "Usuarios",
        href: "/dashboard/users",
        icon: Users,
        requiredPermission: "users.view"
      },
      {
        title: "Perfiles",
        href: "/dashboard/profiles",
        icon: UserCheck,
        requiredPermission: "profiles.view"
      },
      {
        title: "Rutas",
        href: "/dashboard/paths",
        icon: Route,
        requiredPermission: "routes.view"
      },
      {
        title: "Vehículos",
        href: "/dashboard/vehicles",
        icon: Car,
        requiredPermission: "vehicles.view"
      },
    ],
  },
  {
    title: "Clientes",
    icon: Building2,
    children: [
      {
        title: "Clientes",
        href: "/dashboard/clients",
        icon: Building2,
        requiredPermission: "clients.view"
      },
      {
        title: "Sedes",
        href: "/dashboard/sedes",
        icon: MapPin,
        requiredPermission: "sedes.view"
      },
      {
        title: "Cartera",
        href: "/dashboard/cartera",
        icon: CircleDollarSign,
        requiredPermission: "cartera.view"
      },
    ],
  },
  {
    title: "Recolección",
    icon: CalendarSearch,
    children: [
      {
        title: "Admin Recolección",
        href: "/dashboard/progs-admin",
        icon: ShieldCheck,
        requiredPermission: "admin.view"
      },
      {
        title: "Programación",
        href: "/dashboard/progs",
        icon: CalendarRange,
        requiredPermission: "prog.view"
      },
    ],
  },
  {
    title: "Salidas",
    href: "/dashboard/salidas",
    icon: FileCode,
    requiredPermission: "salida.view",
  },
  {
    title: "Certificados",
    href: "/dashboard/certificados",
    icon: FolderDown,
    requiredPermission: "certificados.view",
  },
  {
    title: "Reportes",
    href: "/dashboard/reportes",
    icon: FileCode,
    requiredPermission: "reportes.view",
  },
  {
    title: "Parametrizaciones",
    href: "/dashboard/parametrizations",
    icon: Settings,
    requiredPermission: "settings.view",
  },
  {
    title: "Alertas",
    href: "/dashboard/alertas",
    icon: Bell,
    requiredPermission: "alerts.view",
  },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [alertasCount, setAlertasCount] = useState(0)
  const { user, logout } = useAuth()
  const { config } = useConfig()
  const pathname = usePathname()

  if (user && user.permisos && typeof user.permisos === "string") {
    user.permisos = JSON.parse(user.permisos);
  }

  // Cargar contador de alertas
  useEffect(() => {
    const loadAlertasCount = async () => {
      try {
        const count = await alertService.getAlertasCount()
        setAlertasCount(count.total)
      } catch (error) {
        // Si hay error, no mostrar nada
        setAlertasCount(0)
      }
    }

    // Listener para actualizar el contador cuando se modifique una alerta
    const handleAlertasUpdated = () => {
      loadAlertasCount()
    }

    if (user && hasPermission("vehicles.view")) {
      loadAlertasCount()
      // Recargar cada 5 minutos
      const interval = setInterval(loadAlertasCount, 5 * 60 * 1000)
      
      // Escuchar eventos de actualización de alertas
      window.addEventListener('alertas-updated', handleAlertasUpdated)
      
      return () => {
        clearInterval(interval)
        window.removeEventListener('alertas-updated', handleAlertasUpdated)
      }
    }
  }, [user])

  // Función para verificar si el usuario tiene un permiso específico
  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permisos) return false

    // Si es admin, tiene todos los permisos (usando perfil seleccionado)
    if (user?.perfil?.nombre === "ADMIN") return true

    // Verificar si el usuario tiene el permiso específico
    return user.permisos[permission] === true
  }

  // Función para verificar si un elemento del menú debe mostrarse
  const shouldShowMenuItem = (item: MenuItem): boolean => {
    // Verificar rol requerido (lógica existente)
    if (item.requiredRole && user?.perfil?.nombre !== item.requiredRole && user?.perfil?.nombre !== "ADMIN") {
      return false
    }

    // Verificar permiso requerido
    if (item.requiredPermission && !hasPermission(item.requiredPermission)) {
      return false
    }

    return true
  }

  // Función para verificar si un grupo debe mostrarse
  const shouldShowGroup = (item: MenuItem): boolean => {
    // Si tiene hijos, verificar si al menos uno es visible
    if (item.children && item.children.length > 0) {
      return item.children.some(child => shouldShowMenuItem(child))
    }

    // Si no tiene hijos, usar la lógica normal
    return shouldShowMenuItem(item)
  }

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => (prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]))
  }

  const renderMenuItem = (item: MenuItem, level = 0) => {
    // Verificar si el elemento debe mostrarse
    if (!shouldShowMenuItem(item)) {
      return null
    }

    const isExpanded = expandedItems.includes(item.title)
    const hasChildren = item.children && item.children.length > 0
    const isActive = item.href === pathname

    if (hasChildren) {
      // Para grupos, verificar si tiene hijos visibles
      const visibleChildren = item.children?.filter(child => shouldShowMenuItem(child)) || []

      // Si no hay hijos visibles, no mostrar el grupo
      if (visibleChildren.length === 0) {
        return null
      }

      return (
        <div key={item.title}>
          <Button
            variant="ghost"
            className={cn("w-full justify-start text-left font-normal", level > 0 && "pl-8")}
            onClick={() => toggleExpanded(item.title)}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.title}
            {isExpanded ? <ChevronDown className="ml-auto h-4 w-4" /> : <ChevronRight className="ml-auto h-4 w-4" />}
          </Button>
          {isExpanded && (
            <div className="ml-4">
              {visibleChildren.map((child) => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      )
    }

    return (
      <Link key={item.title} href={item.href!}>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-left font-normal",
            level > 0 && "pl-8",
            isActive && "bg-primary/10 text-primary",
          )}
        >
          <item.icon className="mr-2 h-4 w-4" />
          {item.title}
          {item.title === "Alertas" && alertasCount > 0 && (
            <Badge 
              variant="destructive" 
              className="ml-auto h-5 min-w-5 rounded-full p-0 px-1.5 flex items-center justify-center text-xs"
            >
              {alertasCount}
            </Badge>
          )}
        </Button>
      </Link>
    )
  }

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:inset-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-4 border-b">
            {config?.logo && (
              <img src={config.logo || "/placeholder.svg"} alt={config.companyName} className="h-10 w-auto mr-3" />
            )}
            <span className="font-semibold text-lg">{config?.companyName || ""}</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {menuItems
              .filter(item => shouldShowGroup(item)) // Filtrar grupos no visibles
              .map((item) => renderMenuItem(item))}
          </nav>

          {/* User info and logout */}
          <div className="border-t px-4 py-4">
            <div className="flex items-center mb-4">
              <div className="flex-1">
                <p className="text-sm font-medium">{user?.nombre} {user?.apellido}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.perfil?.nombre}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start new-text-red-600 hover:new-text-red-700 hover:new-bg-red-50"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden" onClick={() => setIsOpen(false)} />
      )}
    </>
  )
}

