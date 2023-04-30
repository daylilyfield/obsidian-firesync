export async function hash(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(digest))
    .map(v => v.toString(16).padStart(2, '0'))
    .join('')
}
