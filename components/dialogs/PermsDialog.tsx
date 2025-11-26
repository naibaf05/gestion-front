"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Shield, Settings, FolderCog, Building2, CalendarSearch, FolderDown, FileCode, Bell } from "lucide-react"
import { userService } from "@/services/userService"
import { PermissionCategory, Profile } from "@/types"

interface PermsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    profile: Profile
    onSuccess: () => void
}

const AVAILABLE_PERMISSIONS: PermissionCategory[] = [
    {
        id: "general",
        name: "General",
        icon: FolderCog,
        permissions: [
            { id: "users.view", name: "Ver usuarios", category: "general" },
            { id: "users.edit", name: "Editar usuarios", category: "general" },
            { id: "users.historial", name: "Ver historial", category: "general" },
            { id: "profiles.view", name: "Ver perfiles", category: "general" },
            { id: "profiles.edit", name: "Editar perfiles", category: "general" },
            { id: "profiles.permissions", name: "Gestionar permisos", category: "general" },
            { id: "routes.view", name: "Ver rutas", category: "general" },
            { id: "routes.edit", name: "Editar rutas", category: "general" },
            { id: "vehicles.view", name: "Ver vehículos", category: "general" },
            { id: "vehicles.edit", name: "Editar vehículos", category: "general" },

        ]
    },
    {
        id: "clients",
        name: "Clientes y Sedes",
        icon: Building2,
        permissions: [
            { id: "clients.view", name: "Ver clientes", category: "clients" },
            { id: "clients.edit", name: "Editar clientes", category: "clients" },
            { id: "sedes.view", name: "Ver sedes", category: "clients" },
            { id: "sedes.edit", name: "Editar sedes", category: "clients" },
            { id: "schedule.view", name: "Ver frecuencias", category: "clients" },
            { id: "schedule.edit", name: "Editar frecuencias", category: "clients" },
            { id: "geo.view", name: "Ver geolocalización", category: "clients" },
            { id: "geo.edit", name: "Editar geolocalización", category: "clients" },
            { id: "rates.view", name: "Ver tarifas", category: "clients" },
            { id: "rates.edit", name: "Editar tarifas", category: "clients" },
            { id: "cartera.view", name: "Ver cartera", category: "clients" },
            { id: "cartera.edit", name: "Editar cartera", category: "clients" },
        ]
    },
    {
        id: "progs",
        name: "Recolección",
        icon: CalendarSearch,
        permissions: [
            { id: "admin.view", name: "Ver Admin Recolección", category: "progs" },
            { id: "admin.edit", name: "Editar Admin Recolección", category: "progs" },
            { id: "amount.view", name: "Ver cantidad", category: "progs" },
            { id: "amount.edit", name: "Editar cantidad", category: "progs" },
            { id: "generar.pdf", name: "Generar PDF", category: "progs" },
            { id: "prog.view", name: "Ver programación", category: "progs" },
            { id: "prog.edit", name: "Editar programación", category: "progs" },
        ]
    },
    {
        id: "salidas",
        name: "Salidas",
        icon: FileCode,
        permissions: [
            { id: "salida.view", name: "Ver Salidas", category: "salidas" },
            { id: "salida.edit", name: "Editar Salidas", category: "salidas" },
        ]
    },
    {
        id: "certificados",
        name: "Certificados",
        icon: FolderDown,
        permissions: [
            { id: "certificados.view", name: "Ver certificados", category: "certificados" },
            { id: "certificados.edit", name: "Editar certificados", category: "certificados" },
        ]
    },
    {
        id: "reportes",
        name: "Reportes",
        icon: FileCode,
        permissions: [
            { id: "reportes.view", name: "Ver Reportes", category: "reportes" },
            { id: "reportes.assign", name: "Asignar Facturas", category: "reportes" },
        ]
    },
    {
        id: "settings",
        name: "Parametrizaciones",
        icon: Settings,
        permissions: [
            { id: "settings.view", name: "Ver parametrizaciones", category: "settings" },
            { id: "settings.edit", name: "Editar parametrizaciones", category: "settings" },
        ]
    },
    {
        id: "alerts",
        name: "Alertas",
        icon: Bell,
        permissions: [
            { id: "alerts.view", name: "Ver alertas", category: "alerts" },
            { id: "alerts.edit", name: "Editar alertas", category: "alerts" },
        ]
    }
]

export function PermsDialog({
    open,
    onOpenChange,
    profile,
    onSuccess,
}: PermsDialogProps) {
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [permissions, setPermissions] = useState<Record<string, boolean>>({})
    const { toast } = useToast()

    useEffect(() => {
        if (open && profile) {
            loadPermissions()
        }
    }, [open, profile])

    const loadPermissions = async () => {
        if (!profile) return

        try {
            setLoading(true)
            // Inicializar permisos desde el perfil o usar los iniciales
            const currentPermissions = profile.permisos || {}

            // Convertir a formato booleano para los checkboxes
            const permissionsState: Record<string, boolean> = {}

            // Recorrer todos los permisos disponibles
            AVAILABLE_PERMISSIONS.forEach(category => {
                category.permissions.forEach(permission => {
                    permissionsState[permission.id] = currentPermissions[permission.id] === true
                })
            })

            setPermissions(permissionsState)
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudieron cargar los permisos del perfil",
                variant: "error",
            })
        } finally {
            setLoading(false)
        }
    }

    const handlePermissionChange = (permissionId: string, checked: boolean) => {
        setPermissions(prev => ({
            ...prev,
            [permissionId]: checked
        }))
    }

    const handleSelectAllCategory = (categoryId: string, checked: boolean) => {
        const category = AVAILABLE_PERMISSIONS.find(cat => cat.id === categoryId)
        if (!category) return

        const updates: Record<string, boolean> = {}
        category.permissions.forEach(permission => {
            updates[permission.id] = checked
        })

        setPermissions(prev => ({
            ...prev,
            ...updates
        }))
    }

    const handleSave = async () => {
        if (!profile) return

        try {
            setSaving(true)

            const permissionsToSave: Record<string, any> = {}
            Object.entries(permissions).forEach(([key, value]) => {
                if (value) {
                    permissionsToSave[key] = true
                }
            })

            const permisosString = JSON.stringify(permissionsToSave);
            await userService.toggleUserPermisos(profile.id, permisosString)

            toast({
                title: "Permisos actualizados",
                description: "Los permisos del perfil han sido actualizados exitosamente",
                variant: "success",
            })

            onSuccess()
            onOpenChange(false)
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudieron actualizar los permisos",
                variant: "error",
            })
        } finally {
            setSaving(false)
        }
    }

    const getCategoryPermissionCount = (categoryId: string) => {
        const category = AVAILABLE_PERMISSIONS.find(cat => cat.id === categoryId)
        if (!category) return { selected: 0, total: 0 }

        const selected = category.permissions.filter(perm => permissions[perm.id]).length
        return { selected, total: category.permissions.length }
    }

    if (loading) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                            <p className="text-sm text-gray-600">Cargando permisos...</p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] perms-dialog-content">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Gestionar Permisos
                        {profile.nombre && <span className="text-muted-foreground">- {profile.nombre}</span>}
                    </DialogTitle>
                </DialogHeader>

                {/* Área de scroll personalizada */}
                <div className="perms-scroll-area custom-scrollbar space-y-6">
                    {AVAILABLE_PERMISSIONS.map((category) => {
                        const { selected, total } = getCategoryPermissionCount(category.id)
                        const IconComponent = category.icon
                        const allSelected = selected === total && total > 0
                        const someSelected = selected > 0 && selected < total

                        return (
                            <Card key={category.id}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <IconComponent className="h-5 w-5 text-primary" />
                                            <div>
                                                <CardTitle className="text-base">{category.name}</CardTitle>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <span className="text-xs text-muted-foreground">
                                                {selected}/{total} seleccionados
                                            </span>
                                            <Checkbox
                                                checked={allSelected}
                                                onCheckedChange={(checked) =>
                                                    handleSelectAllCategory(category.id, checked as boolean)
                                                }
                                                className={someSelected ? "data-[state=checked]:bg-orange-500" : ""}
                                            />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {category.permissions.map((permission) => (
                                            <div
                                                key={permission.id}
                                                className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                            >
                                                <Checkbox
                                                    id={permission.id}
                                                    checked={permissions[permission.id] || false}
                                                    onCheckedChange={(checked) =>
                                                        handlePermissionChange(permission.id, checked as boolean)
                                                    }
                                                    className="mt-0.5"
                                                />
                                                <div className="grid gap-1.5 leading-none">
                                                    <Label
                                                        htmlFor={permission.id}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                    >
                                                        {permission.name}
                                                    </Label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                <Separator className="my-4" />

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-primary hover:bg-primary-hover"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            "Guardar Permisos"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
