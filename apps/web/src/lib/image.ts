export async function convertToWebp(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blobUrl = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d")?.drawImage(img, 0, 0);
      URL.revokeObjectURL(blobUrl);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("webp conversion failed"))),
        "image/webp",
        0.9,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error("Failed to load image"));
    };
    img.src = blobUrl;
  });
}
