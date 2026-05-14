const MAX_PROPERTY_IMAGE_EDGE = 1600;
const PROPERTY_IMAGE_QUALITY = 0.74;

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

const basename = (name: string) => name.replace(/\.[^.]+$/, "") || "image";

const loadBitmap = async (file: File) => {
  if ("createImageBitmap" in window) {
    return createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
};

export async function preparePropertyImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
    return file;
  }

  try {
    const source = await loadBitmap(file);
    const width = source.width;
    const height = source.height;
    const maxEdge = Math.max(width, height);
    const scale = Math.min(1, MAX_PROPERTY_IMAGE_EDGE / maxEdge);
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    canvas.getContext("2d", { alpha: false })?.drawImage(source, 0, 0, targetWidth, targetHeight);
    if ("close" in source && typeof source.close === "function") source.close();

    const blob = await canvasToBlob(canvas, "image/webp", PROPERTY_IMAGE_QUALITY)
      || await canvasToBlob(canvas, "image/jpeg", 0.78);

    if (!blob) return file;
    if (blob.size >= file.size && maxEdge <= MAX_PROPERTY_IMAGE_EDGE) return file;

    const ext = blob.type === "image/webp" ? "webp" : "jpg";
    return new File([blob], `${basename(file.name)}.${ext}`, { type: blob.type, lastModified: Date.now() });
  } catch {
    return file;
  }
}

export function imageFileExtension(file: File) {
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/png") return "png";
  if (file.type === "image/gif") return "gif";
  return "jpg";
}

export async function runLimited<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>) {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}