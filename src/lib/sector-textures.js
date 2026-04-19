/**
 * Emoji-based texture patterns for each business sector.
 * Uses real emoji characters in SVG text elements for recognizable, fun patterns.
 * Each sector gets 4-6 relevant emojis scattered in a repeating tile.
 */

function buildTexture(emojis, tileW = 200, tileH = 200) {
  // Generate scattered positions for emojis with varying sizes and rotations
  const positions = [
    { x: 25, y: 35, size: 20, rotate: -15 },
    { x: 120, y: 25, size: 16, rotate: 12 },
    { x: 70, y: 90, size: 22, rotate: -8 },
    { x: 160, y: 80, size: 14, rotate: 20 },
    { x: 40, y: 150, size: 18, rotate: -22 },
    { x: 130, y: 160, size: 20, rotate: 5 },
    { x: 90, y: 45, size: 13, rotate: -30 },
    { x: 175, y: 140, size: 15, rotate: 18 },
  ];

  const texts = positions.map((p, i) => {
    const emoji = emojis[i % emojis.length];
    return `<text x="${p.x}" y="${p.y}" font-size="${p.size}" opacity="0.07" transform="rotate(${p.rotate} ${p.x} ${p.y})">${emoji}</text>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tileW}" height="${tileH}">${texts}</svg>`;
}

const TEXTURES = {
  photographer: buildTexture(["📸", "🎬", "📷", "🎞️", "✨", "💫"]),
  doctor:       buildTexture(["🩺", "💊", "❤️", "🏥", "💉", "🫀"]),
  dentist:      buildTexture(["🦷", "✨", "😁", "🪥", "💎", "😬"]),
  psychologist: buildTexture(["🧠", "💭", "🛋️", "🌿", "💬", "🧘"]),
  dietitian:    buildTexture(["🥗", "🍎", "🥑", "🥦", "🍋", "💪"]),
  fitness:      buildTexture(["🏋️", "💪", "🏃", "🧘", "⚡", "🔥"]),
  beauty:       buildTexture(["✂️", "💇", "💅", "💄", "✨", "🪞"]),
  veterinary:   buildTexture(["🐾", "🐕", "🐈", "🦴", "❤️", "🐾"]),
  physiotherapist: buildTexture(["🦴", "💆", "🏃", "🤸", "💪", "🧘"]),
  tutor:        buildTexture(["📚", "✏️", "🎓", "📖", "🧮", "💡"]),
  lawyer:       buildTexture(["⚖️", "📜", "🏛️", "📋", "🔍", "⚖️"]),
  consultant:   buildTexture(["💼", "📊", "🤝", "💡", "📈", "🎯"]),
  other:        buildTexture(["⭐", "✨", "💫", "🔹", "⚡", "🌟"]),
};

/**
 * Returns a CSS background-image value for the given business type.
 */
export function getSectorTexture(businessType) {
  const svg = TEXTURES[businessType] || TEXTURES.other;
  const encoded = encodeURIComponent(svg);
  return `url("data:image/svg+xml,${encoded}")`;
}

export default TEXTURES;
