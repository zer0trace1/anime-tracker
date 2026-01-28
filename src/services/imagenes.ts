export async function leerImagenCuadradaComoDataUrl(
  file: File,
  size = 320,
  quality = 0.85
): Promise<string> {
  // Intentamos webp; si falla, jpeg
  const mimePreferido = 'image/webp'

  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear el contexto del canvas')

  // "Cover" (recorte centrado) para rellenar el cuadrado
  const w = bitmap.width
  const h = bitmap.height
  const scale = Math.max(size / w, size / h)
  const sw = size / scale
  const sh = size / scale
  const sx = (w - sw) / 2
  const sy = (h - sh) / 2

  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, size, size)

  // Algunos navegadores pueden no soportar webp en toDataURL (poco frecuente hoy)
  try {
    return canvas.toDataURL(mimePreferido, quality)
  } catch {
    return canvas.toDataURL('image/jpeg', quality)
  } finally {
    // limpieza (algunos navegadores soportan close)
    // @ts-ignore
    bitmap.close?.()
  }
}
