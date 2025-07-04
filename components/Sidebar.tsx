"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useConfig } from "@/contexts/ConfigContext"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Users,
  Building2,
  Settings,
  Home,
  UserCheck,
  MapPin,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Route,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface MenuItem {
  title: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  children?: MenuItem[]
  requiredRole?: string
}

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Usuarios",
    icon: Users,
    children: [
      { title: "Usuarios", href: "/dashboard/users", icon: Users },
      { title: "Perfiles", href: "/dashboard/profiles", icon: UserCheck, requiredRole: "ADMIN" },
    ],
  },
  {
    title: "Clientes",
    icon: Building2,
    children: [
      { title: "Clientes", href: "/dashboard/clients", icon: Building2 },
      { title: "Sedes", href: "/dashboard/sedes", icon: MapPin },
      { title: "Rutas", href: "/dashboard/paths", icon: Route },
    ],
  },
  {
    title: "Parametrizaciones",
    href: "/dashboard/parametrizations",
    icon: Settings,
  },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const { user, logout } = useAuth()
  const { config } = useConfig()
  const pathname = usePathname()

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => (prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]))
  }

  const renderMenuItem = (item: MenuItem, level = 0) => {
    if (item.requiredRole && user?.rolNombre !== item.requiredRole && user?.rolNombre !== "admin") {
      return null
    }

    const isExpanded = expandedItems.includes(item.title)
    const hasChildren = item.children && item.children.length > 0
    const isActive = item.href === pathname

    if (hasChildren) {
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
          {isExpanded && <div className="ml-4">{item.children?.map((child) => renderMenuItem(child, level + 1))}</div>}
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
            <span className="font-semibold text-lg">{config?.companyName || "Sistema"}</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => renderMenuItem(item))}
          </nav>

          {/* User info and logout */}
          <div className="border-t px-4 py-4">
            <div className="flex items-center mb-4">
              <div className="flex-1">
                <p className="text-sm font-medium">{user?.nombre} {user?.apellido}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.rolNombre}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
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

