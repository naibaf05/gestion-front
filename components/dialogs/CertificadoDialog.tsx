"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { certificatesService } from "@/services/certificatesService";
import type { Certificados, Cliente, Parametrizacion, Sede } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { SelectSingle } from "../ui/select-single";
import { SelectMultiple, OptionType } from "../ui/select-multiple";
import { InputCheck } from "../ui/input-check";
import { PdfDialog } from "./PdfDialog";

interface CertificadoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificado?: Certificados | null;
  sedes: Sede[];
  clientes: Cliente[];
  plantas?: Parametrizacion[];
  tipo: string;
  onSuccess: () => void;
}

export function CertificadoDialog({
  open,
  onOpenChange,
  certificado,
  sedes,
  clientes,
  plantas = [],
  tipo,
  onSuccess,
}: CertificadoDialogProps) {
  const [base64, setBase64] = useState<string | null>(null)
  const [dialogPdfOpen, setDialogPdfOpen] = useState(false);
  const [esPlanta, setEsPlanta] = useState(false);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    clienteId: "",
    sedeId: "",
    plantaDestinoId: "",
    fecha: "",
    inicio: "",
    fin: "",
    tipo: "",
    notas: "",
    activo: true,
  });
  // Selección múltiple, solo para tipos 1 (Llantas) y 2 (Residuos) al crear.
  const [clienteIds, setClienteIds] = useState<string[]>([]);
  const [sedeIds, setSedeIds] = useState<string[]>([]);
  const { toast } = useToast();

  const esMultiSelect = !certificado && ["1", "2"].includes(String(tipo));

  const clienteOptions: OptionType[] = clientes.map(c => ({ value: c.id, label: c.nombre }));
  const sedeOptions: OptionType[] = sedes.map(s => ({ value: s.id, label: s.nombre }));

  useEffect(() => {
    setEsPlanta(false);
    setClienteIds([]);
    setSedeIds([]);
    if (certificado) {
      setFormData({
        id: certificado.id,
        clienteId: certificado.clienteId || "",
        sedeId: certificado.sedeId || "",
        plantaDestinoId: (certificado as any).plantaDestinoId || "",
        fecha: certificado.fecha.split('T')[0],
        inicio: certificado.inicio.split('T')[0],
        fin: certificado.fin.split('T')[0],
        tipo: tipo,
        activo: certificado.activo,
        notas: certificado.notas || "",
      });
    } else {
      setFormData({
        id: "",
        clienteId: "",
        sedeId: "",
        plantaDestinoId: "",
        fecha: "",
        inicio: "",
        fin: "",
        tipo: tipo,
        activo: true,
        notas: "",
      });
    }
  }, [certificado, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (esMultiSelect) {
      const ids = clienteIds.length > 0 ? clienteIds : sedeIds;
      const porCliente = clienteIds.length > 0;

      if (ids.length === 0) {
        toast({
          title: "Selecciona cliente(s) o sede(s)",
          description: "Debes seleccionar al menos un cliente o una sede",
          variant: "warning",
        });
        return;
      }

      if (ids.length === 1) {
        // Un solo elemento: igual que antes, se previsualiza antes de guardar.
        setFormData(prev => ({
          ...prev,
          clienteId: porCliente ? ids[0] : "",
          sedeId: porCliente ? "" : ids[0],
        }));
        setLoading(true);
        try {
          await handlePdf(porCliente ? ids[0] : "", porCliente ? "" : ids[0]);
        } finally {
          setLoading(false);
        }
        return;
      }

      await handleBulkCreate(ids, porCliente);
      return;
    }

    setLoading(true);
    try {
      await handlePdf(formData.clienteId, formData.sedeId);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "No se pudo guardar el certificado",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePdfFor = async (clienteId: string, sedeId: string): Promise<string | null> => {
    const tipoString = String(formData.tipo);
    if (tipoString === "1") {
      return certificatesService.getCertificadoRecoleccionLlantasPDF(formData.id, clienteId, sedeId, formData.inicio, formData.fin, "", formData.fecha, formData.notas || "");
    }
    if (tipoString === "2") {
      return certificatesService.getCertificadoRecoleccionPDF(formData.id, clienteId, sedeId, formData.inicio, formData.fin, "", formData.fecha, formData.notas || "");
    }
    return null;
  };

  const nombreDe = (id: string, porCliente: boolean): string => {
    if (porCliente) return clientes.find(c => c.id === id)?.nombre || id;
    return sedes.find(s => s.id === id)?.nombre || id;
  };

  const handleBulkCreate = async (ids: string[], porCliente: boolean) => {
    setLoading(true);
    try {
      // 1) Validar que todos tengan datos antes de crear ninguno.
      const fallos: string[] = [];
      for (const id of ids) {
        try {
          await generatePdfFor(porCliente ? id : "", porCliente ? "" : id);
        } catch {
          fallos.push(nombreDe(id, porCliente));
        }
      }

      if (fallos.length > 0) {
        toast({
          title: "No se creó ningún certificado",
          description: `No se encontraron datos para: ${fallos.join(", ")}. Corrige la selección e intenta de nuevo.`,
          variant: "error",
        });
        return;
      }

      // 2) Todos tienen datos: crear un certificado por cada uno (sin previsualización).
      for (const id of ids) {
        await certificatesService.createCertificado({
          ...formData,
          clienteId: porCliente ? id : "",
          sedeId: porCliente ? "" : id,
        });
      }

      toast({
        title: "Certificados creados",
        description: `Se crearon ${ids.length} certificados correctamente`,
        variant: "success",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "No se pudieron crear los certificados",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveCertificate = async () => {
    setLoading(true);

    try {
      if (certificado) {
        await certificatesService.updateCertificado(certificado.id, formData);
        toast({
          title: "Actualizado",
          description: "El certificado ha sido actualizado correctamente",
          variant: "success",
        });
      } else {
        await certificatesService.createCertificado(formData);
        toast({
          title: "Creado",
          description: "El certificado ha sido creado correctamente",
          variant: "success",
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "No se pudo guardar el certificado",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePdf = async (clienteIdOverride?: string, sedeIdOverride?: string) => {
    try {

      let base64;
      const tipoString = String(formData.tipo);
      const clienteId = clienteIdOverride ?? formData.clienteId;
      const sedeId = sedeIdOverride ?? formData.sedeId;

      switch (tipoString) {
        case "1":
          base64 = await certificatesService.getCertificadoRecoleccionLlantasPDF(formData.id, clienteId, sedeId, formData.inicio, formData.fin, "", formData.fecha, formData.notas || "");
          break;
        case "2":
          base64 = await certificatesService.getCertificadoRecoleccionPDF(formData.id, clienteId, sedeId, formData.inicio, formData.fin, "", formData.fecha, formData.notas || "");
          break;
        case "3":
          base64 = await certificatesService.getCertificadoProformaPDF(formData.clienteId, formData.sedeId, formData.inicio, formData.fin, formData.fecha, formData.notas);
          break;
        case "4":
          base64 = await certificatesService.getCertificadoProformaSalidaPDF(formData.sedeId, formData.plantaDestinoId, formData.inicio, formData.fin, formData.fecha, formData.notas);
          break;
        case "6":
          base64 = await certificatesService.getCertificadoProformaExternaPDF(formData.clienteId, formData.sedeId, formData.inicio, formData.fin, formData.fecha, formData.notas);
          break;
        default:
          base64 = null;
          break;
      }
      setBase64(base64);
      setDialogPdfOpen(true);
    } catch (error: any) {
      console.log(error);
      toast({
        title: "Error",
        description: error.message,
        variant: "warning",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {certificado ? "Editar" : "Nuevo"} Certificado
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {["4"].includes(String(tipo)) ? (
            <div className="space-y-2">
              <Label>Destino</Label>
              <span style={{ paddingLeft: "15px" }}>
                <InputCheck
                  id="esPlanta"
                  checked={esPlanta}
                  onChange={(e) => {
                    setEsPlanta(e.target.checked);
                    setFormData({ ...formData, sedeId: "", plantaDestinoId: "" });
                  }}
                  label="¿Es Planta?"
                />
              </span>
              {esPlanta ? (
                <SelectSingle
                  id="plantaDestino"
                  placeholder="Selecciona una planta"
                  options={plantas}
                  value={formData.plantaDestinoId}
                  onChange={(value) => setFormData({ ...formData, plantaDestinoId: value, sedeId: "", clienteId: "" })}
                  valueKey="id"
                  labelKey="nombreMostrar"
                />
              ) : (
                <SelectSingle
                  id="sedeDestino"
                  placeholder="Selecciona una sede"
                  options={sedes}
                  value={formData.sedeId}
                  onChange={(value) => setFormData({ ...formData, sedeId: value, clienteId: "", plantaDestinoId: "" })}
                  valueKey="id"
                  labelKey="nombre"
                />
              )}
            </div>
          ) : esMultiSelect ? (
            <>
              <div>
                <Label htmlFor="clienteId">Cliente(s)</Label>
                <SelectMultiple
                  options={clienteOptions}
                  value={clienteIds}
                  onChange={(v) => { setClienteIds(v); if (v.length > 0) setSedeIds([]); }}
                  placeholder="Selecciona uno o varios clientes"
                  disabled={sedeIds.length > 0}
                />
              </div>
              <div>
                <Label htmlFor="sedeId">Sede(s)</Label>
                <SelectMultiple
                  options={sedeOptions}
                  value={sedeIds}
                  onChange={(v) => { setSedeIds(v); if (v.length > 0) setClienteIds([]); }}
                  placeholder="Selecciona una o varias sedes"
                  disabled={clienteIds.length > 0}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="clienteId">Cliente</Label>
                <SelectSingle
                  id="cliente"
                  placeholder="Seleccione un cliente"
                  options={clientes}
                  value={formData.clienteId}
                  onChange={v => setFormData({ ...formData, clienteId: v, sedeId: "" })}
                  valueKey="id"
                  labelKey="nombre"
                />
              </div>
              <div>
                <Label htmlFor="sedeId">Sede</Label>
                <SelectSingle
                  id="sede"
                  placeholder="Seleccione una sede"
                  options={sedes}
                  value={formData.sedeId}
                  onChange={v => setFormData({ ...formData, sedeId: v, clienteId: "" })}
                  valueKey="id"
                  labelKey="nombre"
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="fechaInicio">Fecha Inicio</Label>
            <Input
              id="inicio"
              type="date"
              value={formData.inicio}
              onChange={(e) => handleInputChange("inicio", e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="fechaFin">Fecha Fin</Label>
            <Input
              id="fin"
              type="date"
              value={formData.fin}
              onChange={(e) => handleInputChange("fin", e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="notas">Notas</Label>
            <Input
              id="notas"
              type="text"
              value={formData.notas}
              onChange={(e) => handleInputChange("notas", e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {certificado ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {base64 && (
        <PdfDialog
          open={dialogPdfOpen}
          onOpenChange={setDialogPdfOpen}
          base64={base64}
          viewSaveButton={true}
          onSuccess={saveCertificate}
        />
      )}
    </Dialog>
  );
}
