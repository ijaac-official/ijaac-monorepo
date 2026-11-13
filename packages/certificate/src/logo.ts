/** True when the bytes carry a PNG signature. Logo loading itself lives in the apps (fs/fetch). */
export function isPng(bytes: Uint8Array | undefined): bytes is Uint8Array {
  return !!bytes && bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
}
