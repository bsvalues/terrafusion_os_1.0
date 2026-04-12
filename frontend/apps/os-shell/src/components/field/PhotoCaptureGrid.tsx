// TerraFusion OS — Photo Capture Grid for Field Studio
// Camera-first photo capture with preview grid for field inspections.
// Harvested from terra-forge-rebuild

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, ImagePlus, ZoomIn, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CapturedPhoto } from "@/types/field";

const PHOTO_LABELS = ["Front", "Rear", "Left Side", "Right Side", "Interior", "Roof", "Damage", "Other"];

interface PhotoCaptureGridProps {
  photos: CapturedPhoto[];
  onCapture: (photo: CapturedPhoto) => void;
  onRemove: (id: string) => void;
  onLabelChange: (id: string, label: string) => void;
  maxPhotos?: number;
  className?: string;
}

export function PhotoCaptureGrid({
  photos,
  onCapture,
  onRemove,
  onLabelChange,
  maxPhotos = 12,
  className,
}: PhotoCaptureGridProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      Array.from(files).forEach((file) => {
        if (photos.length >= maxPhotos) return;
        const reader = new FileReader();
        reader.onload = () => {
          onCapture({
            id: crypto.randomUUID(),
            dataUrl: reader.result as string,
            label: "",
            timestamp: Date.now(),
          });
        };
        reader.readAsDataURL(file);
      });

      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [photos.length, maxPhotos, onCapture]
  );

  const previewPhoto = photos.find((p) => p.id === previewId);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Photos</span>
          <Badge variant="outline" className="text-[10px]">{photos.length}/{maxPhotos}</Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={photos.length >= maxPhotos}
          className="gap-1.5 text-xs"
        >
          <ImagePlus className="w-3.5 h-3.5" />
          Capture
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <AnimatePresence mode="popLayout">
          {photos.map((photo) => (
            <motion.div
              key={photo.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative group aspect-square rounded-lg overflow-hidden border border-border/30 bg-muted/20"
            >
              <img
                src={photo.dataUrl}
                alt={photo.label || "Inspection photo"}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-1 left-1 right-1 flex items-center gap-1">
                  <button
                    onClick={() => setPreviewId(photo.id)}
                    className="p-1 rounded bg-white/20 hover:bg-white/30"
                  >
                    <ZoomIn className="w-3 h-3 text-white" />
                  </button>
                  <button
                    onClick={() => onRemove(photo.id)}
                    className="p-1 rounded bg-destructive/60 hover:bg-destructive/80"
                  >
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>
                </div>
              </div>
              {photo.label && (
                <Badge className="absolute top-1 left-1 text-[8px] px-1 bg-primary/80">{photo.label}</Badge>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {photos.length < maxPhotos && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-lg border-2 border-dashed border-border/40 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
          >
            <Camera className="w-5 h-5" />
            <span className="text-[10px]">Add</span>
          </button>
        )}
      </div>

      {/* Lightbox Preview */}
      <AnimatePresence>
        {previewPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setPreviewId(null)}
          >
            <div className="relative max-w-lg max-h-[80vh]">
              <img
                src={previewPhoto.dataUrl}
                alt={previewPhoto.label || "Preview"}
                className="max-w-full max-h-[80vh] rounded-lg object-contain"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-white hover:bg-white/20"
                onClick={() => setPreviewId(null)}
              >
                <X className="w-5 h-5" />
              </Button>

              {/* Label selector */}
              <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1">
                {PHOTO_LABELS.map((lbl) => (
                  <button
                    key={lbl}
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] transition-colors",
                      previewPhoto.label === lbl
                        ? "bg-primary text-primary-foreground"
                        : "bg-white/20 text-white hover:bg-white/30"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onLabelChange(previewPhoto.id, lbl);
                    }}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
