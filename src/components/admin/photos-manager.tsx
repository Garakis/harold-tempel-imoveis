"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Upload, Trash2, Star, GripVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  uploadPropertyPhotos,
  deletePhoto,
  reorderPhotos,
  setCoverPhoto,
} from "@/app/admin/(authed)/imoveis/photos-actions";

interface Photo {
  id: string;
  public_url: string;
  is_cover: boolean;
  sort_order: number;
  alt_text: string | null;
}

interface Props {
  propertyId: string;
  initialPhotos: Photo[];
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED = "image/jpeg,image/png,image/webp";

export function PhotosManager({ propertyId, initialPhotos }: Props) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [pending, startTransition] = useTransition();
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const tooBig = Array.from(files).filter((f) => f.size > MAX_FILE_SIZE);
    if (tooBig.length > 0) {
      setUploadMsg(
        `${tooBig.length} arquivo(s) excedem 10MB e foram ignorados.`
      );
    }
    const ok = Array.from(files).filter((f) => f.size <= MAX_FILE_SIZE);
    if (ok.length === 0) return;

    const fd = new FormData();
    for (const f of ok) fd.append("files", f);

    startTransition(async () => {
      try {
        const result = await uploadPropertyPhotos(propertyId, fd);
        setUploadMsg(
          result.failed > 0
            ? `${result.ok} foto(s) enviada(s), ${result.failed} falharam: ${result.errors.join("; ")}`
            : `${result.ok} foto(s) enviada(s). Recarregue para ver.`
        );
        // Force a server-side refresh by reloading the page so we see the new photos
        if (result.ok > 0) {
          setTimeout(() => location.reload(), 800);
        }
      } catch (err) {
        setUploadMsg((err as Error).message ?? "Erro no upload.");
      }
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function onDelete(photoId: string) {
    if (!confirm("Apagar esta foto?")) return;
    startTransition(async () => {
      await deletePhoto(photoId, propertyId);
      setPhotos((ps) => ps.filter((p) => p.id !== photoId));
    });
  }

  async function onSetCover(photoId: string) {
    startTransition(async () => {
      await setCoverPhoto(propertyId, photoId);
      setPhotos((ps) =>
        ps.map((p) => ({ ...p, is_cover: p.id === photoId }))
      );
    });
  }

  // Drag-reorder handlers
  function onDragStart(id: string) {
    setDragId(id);
  }
  function onDragOver(e: React.DragEvent, overId: string) {
    e.preventDefault();
    if (!dragId || dragId === overId) return;
    setPhotos((ps) => {
      const fromIdx = ps.findIndex((p) => p.id === dragId);
      const toIdx = ps.findIndex((p) => p.id === overId);
      if (fromIdx < 0 || toIdx < 0) return ps;
      const next = [...ps];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  }
  function onDragEnd() {
    setDragId(null);
    // Persist new order
    startTransition(async () => {
      await reorderPhotos(
        propertyId,
        photos.map((p) => p.id)
      );
    });
  }

  return (
    <div className="space-y-4">
      {/* Uploader */}
      <div className="rounded-xl border-2 border-dashed border-border bg-white p-6 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED}
          multiple
          className="hidden"
          onChange={onPickFiles}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-pill bg-navy-700 text-white px-5 py-2.5 text-sm font-medium hover:bg-navy-800 transition-colors disabled:opacity-60"
        >
          {pending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {pending ? "Processando..." : "Adicionar fotos"}
        </button>
        <p className="mt-2 text-xs text-muted-foreground">
          JPG/PNG/WEBP até 10MB. As fotos serão redimensionadas para 1920px e receberão a marca d&apos;água automaticamente.
        </p>
        {uploadMsg && (
          <p className="mt-2 text-xs text-navy-700">{uploadMsg}</p>
        )}
      </div>

      {/* Grid */}
      {photos.length === 0 ? (
        <div className="rounded-xl border border-border bg-muted/30 p-12 text-center text-muted-foreground text-sm">
          Nenhuma foto ainda.
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              draggable
              onDragStart={() => onDragStart(photo.id)}
              onDragOver={(e) => onDragOver(e, photo.id)}
              onDragEnd={onDragEnd}
              className={cn(
                "group relative aspect-[4/3] overflow-hidden rounded-xl border bg-muted cursor-move",
                photo.is_cover ? "border-gold-500 ring-2 ring-gold-500" : "border-border",
                dragId === photo.id && "opacity-50"
              )}
            >
              <Image
                src={photo.public_url}
                alt={photo.alt_text ?? ""}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover pointer-events-none"
              />
              {/* Drag handle (top-left) */}
              <div className="absolute left-2 top-2 inline-flex items-center justify-center h-7 w-7 rounded-md bg-white/95 text-navy-700 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical size={14} />
              </div>
              {/* Cover badge */}
              {photo.is_cover && (
                <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-pill bg-gold-500 text-white text-[10px] font-semibold px-2 py-0.5">
                  <Star size={10} /> Capa
                </span>
              )}
              {/* Action buttons */}
              <div className="absolute inset-x-2 bottom-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!photo.is_cover && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onSetCover(photo.id)}
                    className="h-7 flex-1 bg-white/95 text-xs"
                  >
                    <Star size={12} /> Capa
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(photo.id)}
                  className="h-7 bg-white/95 text-red-700 hover:bg-red-50 text-xs"
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Arraste as fotos para reordenar. A primeira (com borda dourada) é a capa exibida nos cards.
      </p>
    </div>
  );
}
