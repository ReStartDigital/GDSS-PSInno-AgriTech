export function initials(value: string): string {
  return value
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return "Good morning";
  }

  if (hour >= 12 && hour < 17) {
    return "Good afternoon";
  }

  return "Good evening";
}

export function getProduceEmoji(cropName: string): string {
  const name = cropName.toLowerCase().trim();
  if (name.includes("tomato")) return "🍅";
  if (name.includes("pepper") || name.includes("chili")) return "🌶️";
  if (name.includes("cabbage") || name.includes("lettuce")) return "🥬";
  if (name.includes("onion") || name.includes("scallion")) return "🧅";
  if (name.includes("yam") || name.includes("potato") || name.includes("cassava")) return "🍠";
  if (name.includes("carrot")) return "🥕";
  if (name.includes("corn") || name.includes("maize")) return "🌽";
  if (name.includes("bean") || name.includes("pea") || name.includes("legume")) return "🫛";
  if (name.includes("okra")) return "🫛";
  if (name.includes("egg")) return "🍆";
  if (name.includes("pineapple")) return "🍍";
  if (name.includes("banana")) return "🍌";
  if (name.includes("mango")) return "🥭";
  if (name.includes("orange") || name.includes("citrus")) return "🍊";
  if (name.includes("watermelon") || name.includes("melon")) return "🍉";
  if (name.includes("avocado")) return "🥑";
  if (name.includes("fruit")) return "🍎";
  return "🥦";
}
