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
import type { Certificados, Sede } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { SelectSingle } from "../ui/select-single";
import { PdfDialog } from "./PdfDialog";

interface CertificadoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificado?: Certificados | null;
  sedes: Sede[];
  tipo: string;
  onSuccess: () => void;
}

export function CertificadoDialog({
  open,
  onOpenChange,
  certificado,
  sedes,
  tipo,
  onSuccess,
}: CertificadoDialogProps) {
  const [base64, setBase64] = useState<string | null>(null)
  const [dialogPdfOpen, setDialogPdfOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sedeId: "",
    inicio: "",
    fin: "",
    tipo: "",
    activo: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (certificado) {
      setFormData({
        sedeId: certificado.sedeId,
        inicio: certificado.inicio.split('T')[0],
        fin: certificado.fin.split('T')[0],
        tipo: tipo,
        activo: certificado.activo,
      });
    } else {
      setFormData({
        sedeId: "",
        inicio: "",
        fin: "",
        tipo: tipo,
        activo: true,
      });
    }
  }, [certificado, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      /*await certificatesService.createCertificado(formData);
      toast({
        title: "Creado",
        description: "El certificado ha sido creado correctamente",
        variant: "success",
      });
      onSuccess();
      onOpenChange(false);*/
      handlePdf();
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

  const saveCertificate = async () => {
    setLoading(true);

    try {
      await certificatesService.createCertificado(formData);
      toast({
        title: "Creado",
        description: "El certificado ha sido creado correctamente",
        variant: "success",
      });
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

  const handlePdf = async () => {
    try {

      let base64;
      const tipoString = String(formData.tipo);
      
      switch (tipoString) {
          case "1":
              base64 = null;
              break;
          case "2":
              base64 = await certificatesService.getCertificadoRecoleccionPDF(formData.sedeId, formData.inicio, formData.fin, "");
              break;
          case "3":   
              base64 = await certificatesService.getCertificadoProformaPDF(formData.sedeId, formData.inicio, formData.fin);
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
          <div>
            <Label htmlFor="sedeId">Sede</Label>
            <SelectSingle
              id="sede"
              placeholder="Seleccione una sede"
              options={sedes}
              value={formData.sedeId}
              onChange={v => setFormData({ ...formData, sedeId: v })}
              valueKey="id"
              labelKey="nombre"
            />
          </div>

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
