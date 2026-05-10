/** Slider 0–1 to dB (same as legacy mixer.js). */
export function sliderToDb(value: number): number {
  const val = (Math.log(value * 100) / Math.log(100)) * 100 - 90
  if (val === -Infinity) return -150
  return val
}

/** dB to slider 0–1 (inverse of sliderToDb). */
export function dbToSlider(db: number): number {
  return Math.pow(100, (db + 90) / 100) / 100
}

/** Hex #rrggbb → "r,g,b" for CSS rgb(var(--tint)). */
export function formatColour(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ].join(',')
    : null
}
