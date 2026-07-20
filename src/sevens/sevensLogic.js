import { createDeck } from "./sevensCards";

export function shuffleCards(cards) {
  const shuffled = [...cards];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[j]] = [
      shuffled[j],
      shuffled[i],
    ];
  }

  return shuffled;
}

export function dealCards(playerCount = 4) {
  const deck = shuffleCards(createDeck());

  const hands = Array.from(
    { length: playerCount },
    () => [],
  );

  deck.forEach((card, index) => {
    hands[index % playerCount].push(card);
  });

  return hands;
}

export function setupSevensGame(playerCount = 4) {
  const hands = dealCards(playerCount);

  const openingSevens = [];

  let firstPlayerIndex = 0;

  hands.forEach((hand, playerIndex) => {
    hand.forEach((card) => {
      if (card.rank !== 7) {
        return;
      }

      openingSevens.push({
        ...card,
        ownerIndex: playerIndex,
      });

      if (card.suit === "diamonds") {
        firstPlayerIndex = playerIndex;
      }
    });
  });

  return {
    hands,
    openingSevens,
    firstPlayerIndex,
  };
}