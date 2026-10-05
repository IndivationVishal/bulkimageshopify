"use client";

import { ImagePlus } from "lucide-react";
import { Dropzone } from "@/components/ui/Dropzone";
import { IMAGE_ACCEPT_ATTR } from "@/lib/constants/image";
import { useImageFiles } from "@/hooks/useImageFiles";
import type { Notice } from "@/hooks/useNotice";

export function ImageDropzone({ onReport, compact }: { onReport: (n: Notice) => void; compact?: boolean }) {
  const { onFiles, onDrop } = useImageFiles(onReport);
  return (
    <Dropzone
      compact={compact}
      title={compact ? "Add more images" : "Drop product images here"}
      description={compact ? undefined : "or click to browse · JPG, PNG, WEBP, GIF, AVIF · drop a folder of product folders to add many products at once"}
      accept={IMAGE_ACCEPT_ATTR}
      onFiles={onFiles}
      onDrop={onDrop}
      icon={compact ? <ImagePlus className="size-4" /> : undefined}
    />
  );
}
