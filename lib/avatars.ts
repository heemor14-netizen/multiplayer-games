export const AVATARS = [
  "🦊", "🦁", "🐼", "🚀", "👑", "⚡", "🌟", "🎮", "🦄", "🎯",
  "🐯", "🦅", "🐺", "🔥", "💎", "🏆", "🍕", "🧙‍♂️", "🤖", "🐱"
];

export const BOT_NAMES = [
  "روبوت ذكي 🤖",
  "عبقري الألعاب 🧠",
  "النمر المقنع 🐯",
  "صقر قريش 🦅",
  "البرنس 👑",
  "فارس الظلام ⚡",
  "نجم اللعبة 🌟",
  "الكابتن 🚀"
];

export function getRandomAvatar(): string {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

export function getRandomBotName(existingNames: string[] = []): string {
  const available = BOT_NAMES.filter((n) => !existingNames.includes(n));
  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)];
  }
  return `بوت ${Math.floor(Math.random() * 1000)} 🤖`;
}
