import imageCompression from "browser-image-compression";

/**
 * Compresses an image file to 500KB maximum using browser-image-compression.
 * If the image is already <= 500KB, it returns the file directly.
 *
 * @param file The original image File
 * @param onProgress Optional callback for compression progress (0-100)
 * @returns Compressed File under 500KB
 */
export async function compressImageTo500KB(
  file: File,
  onProgress?: (progress: number) => void
): Promise<File> {
  // If not an image or already under 500KB, return as is
  if (!file.type.startsWith("image/") || file.size <= 500 * 1024) {
    return file;
  }

  const options = {
    maxSizeMB: 0.49, // 0.49 MB ≈ 500 KB limit
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    initialQuality: 0.85,
    onProgress: onProgress,
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    return new File([compressedBlob], file.name, {
      type: compressedBlob.type || file.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.warn("Image compression warning, using fallback:", error);
    return file;
  }
}
