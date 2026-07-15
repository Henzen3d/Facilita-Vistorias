"use client";

import { useState, useCallback } from "react";

export interface CapturedPhoto {
  file: File;
  blobUrl: string;
  name: string;
}

export function useCamera() {
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const capturePhoto = useCallback((): Promise<CapturedPhoto> => {
    return new Promise((resolve, reject) => {
      setLoading(true);
      setError(null);

      // Create a hidden input element on the fly
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      // This attribute triggers the native device camera directly on mobile browsers
      input.setAttribute("capture", "environment");

      input.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];

        if (file) {
          try {
            const blobUrl = URL.createObjectURL(file);
            const captured: CapturedPhoto = {
              file,
              blobUrl,
              name: file.name || `photo-${Date.now()}.jpg`,
            };
            setPhoto(captured);
            resolve(captured);
          } catch (err: any) {
            setError("Falha ao processar o arquivo da imagem.");
            reject(err);
          } finally {
            setLoading(false);
          }
        } else {
          setLoading(false);
          reject(new Error("Nenhuma imagem selecionada ou operação cancelada."));
        }
      };

      input.onerror = (err) => {
        setLoading(false);
        setError("Erro ao acessar a câmera do dispositivo.");
        reject(err);
      };

      // Trigger the selection dialog/camera
      input.click();
    });
  }, []);

  const clearPhoto = useCallback(() => {
    if (photo?.blobUrl) {
      URL.revokeObjectURL(photo.blobUrl);
    }
    setPhoto(null);
  }, [photo]);

  return { capturePhoto, photo, clearPhoto, loading, error };
}
