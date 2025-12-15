"use client";

import { useState, useEffect } from "react";
import * as FileUpload from "@/components/ui/file-upload";
import { Upload, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

interface DropzoneProps {
  label?: string;
  maxSize?: number; // bytes
  allowedTypes?: string[];
  required?: boolean;
  onChange?: (file: File | null) => void;
  defaultValue?: File | string | null;
}

export default function Dropzone({
  label = "",
  maxSize = 5 * 1024 * 1024,
  allowedTypes = ["image/png", "image/jpeg"],
  required = false,
  onChange,
  defaultValue = null,
}: DropzoneProps) {
  const [file, setFile] = useState<File | null>(
    defaultValue instanceof File ? defaultValue : null,
  );

  const [preview, setPreview] = useState<string | null>(
    typeof defaultValue === "string"
      ? defaultValue
      : defaultValue instanceof File
        ? URL.createObjectURL(defaultValue)
        : null,
  );

  const [error, setError] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // --- Sync defaultValue ---
  useEffect(() => {
    if (defaultValue instanceof File) {
      setFile(defaultValue);
      setPreview(URL.createObjectURL(defaultValue));
    } else if (typeof defaultValue === "string") {
      setFile(null);
      setPreview(defaultValue);
    } else {
      setFile(null);
      setPreview(null);
    }
  }, [defaultValue]);

  // Cleanup URL blob
  useEffect(() => {
    return () => {
      if (file instanceof File && preview) URL.revokeObjectURL(preview);
    };
  }, [file, preview]);

  const validateFile = (f: File | null) => {
    if (!f) {
      if (required) setError("This field is required");
      return false;
    }
    if (f.size > maxSize) {
      setError(`Max size ${Math.round(maxSize / 1024 / 1024)}MB`);
      return false;
    }
    if (!allowedTypes.includes(f.type)) {
      setError("Invalid file type");
      return false;
    }
    setError("");
    return true;
  };

  const handleFileChange = (files: File[]) => {
    const f = files[0] ?? null;
    if (!validateFile(f)) {
      handleDelete();
      return;
    }
    if (preview && file instanceof File) {
      URL.revokeObjectURL(preview);
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    onChange?.(f);
  };

  const handleDelete = () => {
    if (preview && file instanceof File) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview(null);
    onChange?.(null);
    if (required) setError("This field is required");
    else setError("");
  };

  return (
    <div className="w-full space-y-2">
      <Label className="font-medium flex items-center gap-1">
        {label} {required && <span className="text-red-500"></span>}
      </Label>

      <FileUpload.Root
        value={file ? [file] : []}
        onValueChange={handleFileChange}
        maxFiles={1}
        maxSize={maxSize}
        className="w-full"
      >
        {!preview && (
          <FileUpload.Dropzone className="p-6 border rounded-xl flex flex-col items-center text-center gap-2">
            <Upload className="size-6 text-muted-foreground" />
            <div className="text-sm font-medium">Drag or click to upload</div>
            <div className="text-xs text-muted-foreground">
              Max {Math.round(maxSize / 1024 / 1024)}MB — Allowed:{" "}
              {allowedTypes.map((t) => t.split("/")[1]).join(", ")}
            </div>
            <FileUpload.Trigger asChild>
              <Button size="sm" variant="outline">
                Choose File
              </Button>
            </FileUpload.Trigger>
          </FileUpload.Dropzone>
        )}

        {preview && !file && (
          <div className="flex items-center gap-3 p-2 border rounded-md mt-2">
            <div
              className="size-16 rounded-md overflow-hidden cursor-pointer"
              onClick={() => setLightboxOpen(true)}
            >
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 text-sm truncate">{preview}</div>

            <Button size="icon" variant="ghost" onClick={handleDelete}>
              <X className="size-4" />
            </Button>
          </div>
        )}

        {preview && file && (
          <FileUpload.List className="mt-2">
            <FileUpload.Item
              value={file}
              className="flex items-center gap-3 p-2 border rounded-md"
            >
              <FileUpload.ItemPreview
                className="size-16 rounded-md overflow-hidden cursor-pointer"
                onClick={() => setLightboxOpen(true)}
              >
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </FileUpload.ItemPreview>

              <div className="flex-1 text-sm truncate">{file?.name}</div>

              <FileUpload.ItemDelete asChild>
                <Button size="icon" variant="ghost" onClick={handleDelete}>
                  <X className="size-4" />
                </Button>
              </FileUpload.ItemDelete>
            </FileUpload.Item>
          </FileUpload.List>
        )}
      </FileUpload.Root>

      {error && <p className="text-red-500 text-xs">{error}</p>}

      {lightboxOpen && preview && (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={[{ src: preview }]}
        />
      )}
    </div>
  );
}
