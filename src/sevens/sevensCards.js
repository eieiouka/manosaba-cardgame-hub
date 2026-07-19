export const SUITS = [
  "spades",
  "hearts",
  "diamonds",
  "clubs",
];

export function createDeck() {
  return SUITS.flatMap((suit) =>
    Array.from({ length: 13 }, (_, index) => ({
      id: `${suit}-${index + 1}`,
      suit,
      rank: index + 1,
    })),
  );
}