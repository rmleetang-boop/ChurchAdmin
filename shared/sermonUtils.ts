export function pickSermonHighlights(segments: Array<{ text: string }>, limit = 5): string[] {
  return segments
    .map(segment => segment.text.trim())
    .filter(text => text.length > 30)
    .filter((text, index, list) => list.indexOf(text) === index)
    .slice(0, limit);
}
