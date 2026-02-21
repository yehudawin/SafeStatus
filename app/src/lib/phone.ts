/** Format raw digits to display: 0541234567 → 054-123-4567 */
export function formatPhone(raw: string): string {
  if (!raw) return ''
  let f = raw
  if (raw.length > 3) f = raw.slice(0, 3) + '-' + raw.slice(3)
  if (raw.length > 6) f = f.slice(0, 7) + '-' + f.slice(7)
  return f
}

/** Raw local input → E.164 for Supabase Auth: "0541234567" → "+972541234567" */
export function toE164(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('972')) return '+' + digits
  if (digits.startsWith('0')) return '+972' + digits.slice(1)
  return '+972' + digits
}

/** Normalize any phone string to internal format: "054-123-4567" → "972541234567" */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  let n: string
  if (digits.startsWith('972') && digits.length >= 9) n = digits
  else if (digits.startsWith('0') && digits.length >= 9) n = '972' + digits.slice(1)
  else if (digits.length >= 9 && digits.length <= 10) n = '972' + digits
  else return null
  if (n.length < 11 || n.length > 12) return null
  return n
}
