import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Lazy thumbnail from an object URL; falls back to an icon (e.g. HEIC). */
export function Thumb({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  return (
    <div className={cn("overflow-hidden bg-surface-2", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- local object URLs, not optimizable
        <img src={src} alt={alt} loading="lazy" decoding="async" draggable={false} className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center text-subtle">
          <ImageOff className="size-5" aria-hidden />
        </div>
      )}
    </div>
  );
}
