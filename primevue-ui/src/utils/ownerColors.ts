// Owner colors are stored as PrimeVue severity names. Each maps to a palette
// that the active theme defines as --p-<palette>-<shade> CSS variables.
const palettes: Record<string, string> = {
  active: 'slate',
  success: 'green',
  info: 'sky',
  warning: 'orange',
  danger: 'red',
}

export interface OwnerColorOption {
  label: string
  value: string
}

export const ownerColorOptions: OwnerColorOption[] = [
  { label: 'Grey', value: 'active' },
  { label: 'Green', value: 'success' },
  { label: 'Blue', value: 'info' },
  { label: 'Orange', value: 'warning' },
  { label: 'Red', value: 'danger' },
]

// Both helpers mirror how Lara derives its primary colors, per color scheme.
// light-dark() resolves against the color-scheme Lara sets for .app-dark.

/** Solid owner color — same pattern as Lara's `primary.color` (500 light / 400 dark). */
export function ownerColor(color?: string | null): string {
  const p = palettes[color ?? ''] ?? 'surface'
  return `light-dark(var(--p-${p}-500), var(--p-${p}-400))`
}

/**
 * Owner background — same pattern as Lara's `highlight.background`:
 * solid 50 shade in light mode, 400 at 16% opacity in dark mode.
 */
export function ownerHighlight(color?: string | null): string {
  const p = palettes[color ?? ''] ?? 'surface'
  return `light-dark(var(--p-${p}-50), color-mix(in srgb, var(--p-${p}-400), transparent 84%))`
}

/** Row background for rows belonging to an owner. */
export function ownerRowStyle(color?: string | null): Record<string, string> {
  if (!color) return {}
  return { backgroundColor: ownerHighlight(color) }
}
