/** PNG pHYs DPI helpers — critical for print-ready AI image exports. */

const PNG_SIG = [137, 80, 78, 71, 13, 10, 26, 10]

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
  }
  return (c ^ 0xffffffff) >>> 0
}

function isPng(bytes: Uint8Array): boolean {
  if (bytes.length < 8) return false
  return PNG_SIG.every((b, i) => bytes[i] === b)
}

/** Read DPI from PNG pHYs chunk. Returns null if missing/invalid. */
export function readPngDpi(bytes: Uint8Array): number | null {
  if (!isPng(bytes)) return null
  let cursor = 8
  while (cursor + 12 <= bytes.length) {
    const len = new DataView(bytes.buffer, bytes.byteOffset + cursor, 4).getUint32(0)
    const type = String.fromCharCode(
      bytes[cursor + 4],
      bytes[cursor + 5],
      bytes[cursor + 6],
      bytes[cursor + 7]
    )
    if (type === 'pHYs' && len >= 9) {
      const dv = new DataView(bytes.buffer, bytes.byteOffset + cursor + 8, 9)
      const ppmX = dv.getUint32(0)
      const unit = bytes[cursor + 16]
      if (unit === 1 && ppmX > 0) {
        return Math.round(ppmX * 0.0254)
      }
      return null
    }
    if (type === 'IEND') break
    cursor += 4 + 4 + len + 4
  }
  return null
}

/** Embed / replace pHYs chunk so Photoshop, browsers & printers respect DPI. */
export async function embedPngDpi(pngBlob: Blob, dpi: number): Promise<Blob> {
  const buffer = await pngBlob.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  if (!isPng(bytes)) return pngBlob

  const ppm = Math.round(dpi / 0.0254)
  const type = new TextEncoder().encode('pHYs')
  const data = new Uint8Array(9)
  const view = new DataView(data.buffer)
  view.setUint32(0, ppm)
  view.setUint32(4, ppm)
  data[8] = 1 // meter

  const crcInput = new Uint8Array(13)
  crcInput.set(type, 0)
  crcInput.set(data, 4)
  const crc = crc32(crcInput)

  const chunk = new Uint8Array(21)
  const chunkView = new DataView(chunk.buffer)
  chunkView.setUint32(0, 9)
  chunk.set(type, 4)
  chunk.set(data, 8)
  chunkView.setUint32(17, crc)

  const offset = 8
  const ihdrLen = new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0)
  const ihdrEnd = offset + 4 + 4 + ihdrLen + 4

  const parts: Uint8Array[] = [bytes.slice(0, ihdrEnd)]
  let cursor = ihdrEnd
  while (cursor < bytes.length) {
    const len = new DataView(bytes.buffer, bytes.byteOffset + cursor, 4).getUint32(0)
    const typeStr = String.fromCharCode(
      bytes[cursor + 4],
      bytes[cursor + 5],
      bytes[cursor + 6],
      bytes[cursor + 7]
    )
    const next = cursor + 4 + 4 + len + 4
    if (typeStr !== 'pHYs') parts.push(bytes.slice(cursor, next))
    cursor = next
  }

  const total =
    parts[0].length + chunk.length + parts.slice(1).reduce((s, p) => s + p.length, 0)
  const result = new Uint8Array(total)
  let pos = 0
  result.set(parts[0], pos)
  pos += parts[0].length
  result.set(chunk, pos)
  pos += chunk.length
  for (let i = 1; i < parts.length; i++) {
    result.set(parts[i], pos)
    pos += parts[i].length
  }
  return new Blob([result], { type: 'image/png' })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
