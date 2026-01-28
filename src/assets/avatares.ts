import type { AvatarId } from '@/types/domain'

export const AVATARES: { id: AvatarId; nombre: string; svg: string }[] = [
  {
    id: 'ghibli-1',
    nombre: 'Brisa',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#F6F1E7"/>
          <stop offset="1" stop-color="#B7D3C6"/>
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="48" fill="url(#g)"/>
      <circle cx="80" cy="76" r="34" fill="#2F3A33" opacity="0.12"/>
      <path d="M30 118c18-22 34-28 50-28s32 6 50 28" fill="none" stroke="#2F3A33" stroke-width="10" stroke-linecap="round" opacity="0.18"/>
      <path d="M52 66c8-10 20-16 28-16s20 6 28 16" fill="none" stroke="#2F3A33" stroke-width="8" stroke-linecap="round" opacity="0.20"/>
      <path d="M58 78c6 8 14 12 22 12s16-4 22-12" fill="none" stroke="#2F3A33" stroke-width="8" stroke-linecap="round" opacity="0.18"/>
    </svg>`,
  },
  {
    id: 'ghibli-2',
    nombre: 'Bosque',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <rect width="160" height="160" rx="48" fill="#E9F1EA"/>
      <circle cx="52" cy="60" r="22" fill="#5F7C6B" opacity="0.20"/>
      <circle cx="106" cy="58" r="18" fill="#5F7C6B" opacity="0.18"/>
      <path d="M34 120c20-26 38-34 46-34s26 8 46 34" fill="none" stroke="#3A4A40" stroke-width="10" stroke-linecap="round" opacity="0.18"/>
      <path d="M54 70c6-6 14-10 26-10s20 4 26 10" fill="none" stroke="#3A4A40" stroke-width="8" stroke-linecap="round" opacity="0.18"/>
      <path d="M62 86c10 10 26 10 36 0" fill="none" stroke="#3A4A40" stroke-width="8" stroke-linecap="round" opacity="0.15"/>
    </svg>`,
  },
  {
    id: 'ghibli-3',
    nombre: 'Cielo',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <defs>
        <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#E9F2FF"/>
          <stop offset="1" stop-color="#F6F1E7"/>
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="48" fill="url(#s)"/>
      <path d="M30 58c10-12 26-16 38-10 12-6 28-2 36 10 10-6 22-4 26 6-4 12-16 18-30 14-10 10-26 12-40 4-16 8-34 4-42-10-10 2-18-2-22-8 2-4 6-6 10-6z"
        fill="#2D3A55" opacity="0.10"/>
      <path d="M34 122c20-24 38-32 46-32s26 8 46 32" fill="none" stroke="#2D3A55" stroke-width="10" stroke-linecap="round" opacity="0.16"/>
    </svg>`,
  },
  { id: 'ghibli-4', nombre: 'Té', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <rect width="160" height="160" rx="48" fill="#F6F1E7"/>
      <circle cx="80" cy="76" r="38" fill="#7A5A44" opacity="0.10"/>
      <path d="M44 60c8-10 18-14 36-14s28 4 36 14" fill="none" stroke="#7A5A44" stroke-width="8" stroke-linecap="round" opacity="0.18"/>
      <path d="M44 120c18-22 34-28 36-28s18 6 36 28" fill="none" stroke="#7A5A44" stroke-width="10" stroke-linecap="round" opacity="0.18"/>
      <path d="M66 82c8 8 20 8 28 0" fill="none" stroke="#7A5A44" stroke-width="8" stroke-linecap="round" opacity="0.14"/>
    </svg>` },
  { id: 'ghibli-5', nombre: 'Musgo', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <rect width="160" height="160" rx="48" fill="#EAF3ED"/>
      <path d="M22 104c18-18 34-22 46-16 12-10 30-12 44-2 10-8 22-8 28 0 6 10 2 22-8 28-14 8-36 10-58 0-16 10-38 8-52-10z"
        fill="#2F3A33" opacity="0.10"/>
      <path d="M36 122c20-24 38-32 44-32s24 8 44 32" fill="none" stroke="#2F3A33" stroke-width="10" stroke-linecap="round" opacity="0.16"/>
    </svg>` },
  { id: 'ghibli-6', nombre: 'Luna', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <rect width="160" height="160" rx="48" fill="#F2F0FF"/>
      <path d="M110 52c-10 2-18 10-20 20-2 12 6 24 18 26-12 8-30 4-38-10-10-18 2-40 22-44 6-2 12-2 18 0z"
        fill="#2D2740" opacity="0.10"/>
      <path d="M38 122c20-24 38-32 44-32s24 8 44 32" fill="none" stroke="#2D2740" stroke-width="10" stroke-linecap="round" opacity="0.16"/>
    </svg>` },
]

export function avatarUrl(id: AvatarId): string {
  const fallback = AVATARES[0]!
  const found = AVATARES.find(a => a.id === id) ?? fallback
  const svg = found.svg.trim()
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function resolverAvatar(avatarId: AvatarId, avatarPersonalizado?: string | null): string {
  return avatarPersonalizado ? avatarPersonalizado : avatarUrl(avatarId)
}

