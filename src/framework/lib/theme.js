/* theme.js — per-category colour helpers (oklch, keyed by hue) */

export function catTint(hue)  { return `oklch(0.955 0.036 ${hue})`; }
export function catInk(hue)   { return `oklch(0.50 0.10 ${hue})`; }
export function catSolid(hue) { return `oklch(0.62 0.095 ${hue})`; }
export function catDeep(hue)  { return `oklch(0.30 0.05 ${hue})`; }
