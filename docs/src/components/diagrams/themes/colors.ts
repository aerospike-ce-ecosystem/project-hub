export const palette = {
  blue:   { bg: '#e1f5fe', border: '#0288d1' },
  purple: { bg: '#f3e5f5', border: '#9c27b0' },
  green:  { bg: '#e8f5e9', border: '#4caf50' },
  orange: { bg: '#fff3e0', border: '#f57c00' },
  red:    { bg: '#ffebee', border: '#e53935' },
  pink:   { bg: '#fce4ec', border: '#c62828' },
  teal:   { bg: '#e0f2f1', border: '#00897b' },
  grey:   { bg: '#f5f5f5', border: '#757575' },
  indigo: { bg: '#e8eaf6', border: '#3f51b5' },
} as const;

export type ColorGroup = keyof typeof palette;

export function getColors(group?: string) {
  if (!group) return palette.grey;
  return palette[group as ColorGroup] ?? palette.grey;
}
