"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, Search, AlertCircle } from "lucide-react"
import { useRecaptcha } from "@/hooks/useRecaptcha"
import { publicValidationService } from "@/services/publicValidationService"
import { PdfDialog } from "@/components/dialogs/PdfDialog"
import type { PublicValidationResult } from "@/types"

type Tipo = "certificado" | "remision"

export default function ValidarPageInner() {
    const searchParams = useSearchParams()

    const [tipo, setTipo] = useState<Tipo>("certificado")
    const [numero, setNumero] = useState("")
    const [buscando, setBuscando] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [resultado, setResultado] = useState<PublicValidationResult | null>(null)
    const [tipoResultado, setTipoResultado] = useState<Tipo>("certificado")
    const [dialogOpen, setDialogOpen] = useState(false)
    const { getToken } = useRecaptcha()

    const buscar = async (tipoBuscado: Tipo, numeroBuscado: string) => {
        if (!numeroBuscado.trim()) {
            setError("Ingresa el número del documento a validar.")
            return
        }

        setBuscando(true)
        setError(null)
        setResultado(null)

        try {
            const recaptchaToken = await getToken("validar_documento")
            const response = tipoBuscado === "certificado"
                ? await publicValidationService.getCertificado(numeroBuscado, recaptchaToken)
                : await publicValidationService.getRemision(numeroBuscado, recaptchaToken)

            if (response.success && response.data) {
                setResultado(response.data)
                setTipoResultado(tipoBuscado)
                setDialogOpen(true)
            } else {
                setError(response.message || "Documento no encontrado o el enlace no es válido.")
            }
        } catch (err: any) {
            setError(err?.message || "Documento no encontrado o el enlace no es válido.")
        } finally {
            setBuscando(false)
        }
    }

    useEffect(() => {
        const tipoParam = searchParams.get("tipo")
        const numeroParam = searchParams.get("numero")

        if (numeroParam) {
            const tipoInicial: Tipo = tipoParam === "remision" ? "remision" : "certificado"
            setTipo(tipoInicial)
            setNumero(numeroParam)
            buscar(tipoInicial, numeroParam)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        buscar(tipo, numero)
    }

    const tituloDialog = tipoResultado === "certificado" ? "Certificado válido" : "Remisión válida"
    const mensajeDialog = tipoResultado === "certificado"
        ? "Este certificado es el original emitido por Focus Green SAS"
        : "Esta remisión es el original emitido por Focus Green SAS"

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-4">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900">Validar documento</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Consulta la autenticidad de un certificado o una remisión emitidos por Focus Green SAS
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Buscar documento</CardTitle>
                        <CardDescription>Selecciona el tipo de documento e ingresa su número</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Tabs value={tipo} onValueChange={(value) => setTipo(value as Tipo)}>
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="certificado">Certificado</TabsTrigger>
                                    <TabsTrigger value="remision">Remisión</TabsTrigger>
                                </TabsList>
                            </Tabs>

                            <div>
                                <Label htmlFor="numero">
                                    Número {tipo === "certificado" ? "del certificado" : "de la remisión"}
                                </Label>
                                <Input
                                    id="numero"
                                    value={numero}
                                    onChange={(e) => setNumero(e.target.value)}
                                    placeholder={tipo === "certificado" ? "Ej: CFG00496" : "Ej: 00081"}
                                />
                            </div>

                            {error && (
                                <div className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <Button type="submit" className="w-full bg-primary hover:bg-primary-hover" disabled={buscando}>
                                {buscando ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Buscando...
                                    </>
                                ) : (
                                    <>
                                        <Search className="mr-2 h-4 w-4" />
                                        Buscar
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {resultado && (
                <PdfDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    title={tituloDialog}
                    description={mensajeDialog}
                    base64={resultado.pdfBase64}
                />
            )}
        </div>
    )
}
