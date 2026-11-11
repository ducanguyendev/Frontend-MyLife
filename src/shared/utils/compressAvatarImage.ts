const MAX_DIMENSION = 1024;
const WEBP_QUALITY = 0.82;
const SMALL_FILE_THRESHOLD = 512 * 1024;

/**
 * Downscales static avatars before upload. Animated GIFs are intentionally
 * preserved byte-for-byte so client-side canvas conversion cannot discard
 * their animation frames.
 */
export async function compressAvatarImage(file: File): Promise<File> {
  if (file.type.toLowerCase() === 'image/gif') return file;

  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    if (scale === 1 && file.size <= SMALL_FILE_THRESHOLD) return file;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return file;

    context.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY),
    );
    if (!blob || (scale === 1 && blob.size >= file.size)) return file;

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'avatar';
    // Browsers may fall back to PNG when the requested encoder is unavailable.
    const extension = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' }[blob.type];
    if (!extension) throw new Error('Unsupported compressed image format.');
    return new File([blob], `${baseName}.${extension}`, {
      type: blob.type,
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}
