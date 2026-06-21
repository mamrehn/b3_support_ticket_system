// Bildverarbeitung für den Wireshark-Trace-Screenshot.
// Der Screenshot wird clientseitig herunterskaliert und als JPEG-Data-URL
// kodiert. So lässt er sich platzsparend direkt im Ticket (Spalte trace_note)
// speichern – ohne separaten Storage-Bucket und über die bestehende RPC.

export async function fileToCompressedDataUrl(
  file: File,
  maxDim = 1500,
  quality = 0.82,
): Promise<string> {
  const original = await readAsDataUrl(file);
  const img = await loadImage(original);

  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return original; // Fallback: unverändert

  // Weißer Hintergrund (JPEG kennt keine Transparenz).
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', quality);
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Bild konnte nicht geladen werden.'));
    img.src = src;
  });
}
