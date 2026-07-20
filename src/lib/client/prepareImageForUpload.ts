"use client";

import { imageUploadConstraints } from "@/lib/content/shared";

const MAX_DIMENSION = 2200;
const MIN_QUALITY = 0.45;
const QUALITY_STEP = 0.08;
const RESIZE_STEP = 0.86;

type PreparedImageResult = {
  file: File;
  wasOptimized: boolean;
};

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("UPLOAD_FAILED"));
    image.src = src;
  });
}

function blobFromCanvas(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("UPLOAD_FAILED"));
          return;
        }
        resolve(blob);
      },
      type,
      quality,
    );
  });
}

function getOutputType(file: File) {
  if (file.type === "image/png" || file.type === "image/webp" || file.type === "image/avif") {
    return "image/webp";
  }
  return "image/jpeg";
}

function getOutputName(file: File, outputType: string) {
  const base = file.name.replace(/\.[^.]+$/, "");
  const extension = outputType === "image/jpeg" ? "jpg" : "webp";
  return `${base}.${extension}`;
}

export async function prepareImageForUpload(file: File): Promise<PreparedImageResult> {
  if (!imageUploadConstraints.allowedTypes.includes(file.type as any)) {
    throw new Error("INVALID_IMAGE_TYPE");
  }

  if (typeof window === "undefined") {
    return { file, wasOptimized: false };
  }

  const shouldOptimize = file.size > 1.5 * 1024 * 1024;
  if (!shouldOptimize && file.size <= imageUploadConstraints.maxBytes) {
    return { file, wasOptimized: false };
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("UPLOAD_FAILED");
    }

    let width = image.width;
    let height = image.height;
    const maxSide = Math.max(width, height);

    if (maxSide > MAX_DIMENSION) {
      const scale = MAX_DIMENSION / maxSide;
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));
    }

    const outputType = getOutputType(file);
    let quality = outputType === "image/jpeg" || outputType === "image/webp" ? 0.9 : undefined;

    while (true) {
      canvas.width = width;
      canvas.height = height;
      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);

      const blob = await blobFromCanvas(canvas, outputType, quality);

      if (blob.size <= imageUploadConstraints.maxBytes) {
        const optimized = new File([blob], getOutputName(file, outputType), {
          type: outputType,
          lastModified: Date.now(),
        });
        return { file: optimized, wasOptimized: true };
      }

      if (quality && quality > MIN_QUALITY) {
        quality = Math.max(MIN_QUALITY, quality - QUALITY_STEP);
        continue;
      }

      const nextWidth = Math.max(1, Math.round(width * RESIZE_STEP));
      const nextHeight = Math.max(1, Math.round(height * RESIZE_STEP));

      if (nextWidth === width && nextHeight === height) {
        throw new Error("IMAGE_TOO_LARGE");
      }

      width = nextWidth;
      height = nextHeight;

      if (width < 400 || height < 400) {
        throw new Error("IMAGE_TOO_LARGE");
      }

      quality = outputType === "image/jpeg" || outputType === "image/webp" ? 0.82 : undefined;
    }
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
