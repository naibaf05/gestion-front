"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Eye, PowerSquare } from "lucide-react"
import { userService } from "@/services/userService"
import type { User, Profile } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { UserDialog } from "@/components/dialogs/UserDialog"
import type { ColumnDef } from "@tanstack/react-table"

export default function ProgsAdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [usersData, profilesData] = await Promise.all([
        userService.getUsers(),
        userService.getProfiles()
      ])
      setUsers(usersData)
      setProfiles(profilesData)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedUser(null)
    setDialogOpen(true)
  }

  const handleEdit = (employee: User) => {
    setSelectedUser(employee)
    setDialogOpen(true)
  }

  const handleToggleStatus = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas cambiar el estado a este cliente?")) {
      try {
        await userService.toggleUserStatus(id)
        toast({
          title: "Estado actualizado",
          description: "El estado del estado ha sido actualizado",
        })
        loadData()
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo actualizar el estado",
          variant: "destructive",
        })
      }
    }
  }

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "nombre",
      header: "Nombre",
      cell: ({ row }) => {
        return `${row.original.nombre} ${row.original.apellido}`
      },
    },
    {
      accessorKey: "documento",
      header: "Documento",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "telefono",
      header: "Teléfono",
    },
    {
      accessorKey: "perfil",
      header: "Perfil",
      cell: ({ row }) => {
        const profile = profiles.find((p) => p.id === row.original.rolId)
        return profile?.nombre || "N/A"
      },
    },
    {
      accessorKey: "activo",
      header: "Estado",
      cell: ({ row }) => {
        return (
          <Badge variant={row.getValue("activo") ? "default" : "secondary"}>
            {row.getValue("activo") ? "Activo" : "Inactivo"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const employee = row.original
        return (
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => handleEdit(employee)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleStatus(employee.id)}
              className={employee.activo ? "text-green-600" : "text-red-600"}
            >
              <PowerSquare className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-600">Gestiona los usuarios del sistema</p>
        </div>
        <Button onClick={handleCreate} className="bg-primary hover:bg-primary-hover">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      <Card>
        <CardContent>
          <DataTable columns={columns} data={users} searchKey="nombre" searchPlaceholder="Buscar por nombre..." />
        </CardContent>
      </Card>

      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={selectedUser}
        profiles={profiles}
        onSuccess={loadData}
      />
    </div>
  )
}