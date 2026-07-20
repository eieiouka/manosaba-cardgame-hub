export function isCpuCardPlayable(card, board) {
  const playedCards = board[card.suit];

  if (!playedCards || playedCards.length === 0) {
    return card.rank === 7;
  }

  const lowestRank = Math.min(...playedCards);
  const highestRank = Math.max(...playedCards);

  return (
    card.rank === lowestRank - 1 ||
    card.rank === highestRank + 1
  );
}

export function getCpuPlayableCards(cpuHand, board) {
  return cpuHand.filter((card) =>
    isCpuCardPlayable(card, board),
  );
}

export function chooseCpuAction({
  cpuHand,
  board,
  remainingPasses,
}) {
  const playableCards = getCpuPlayableCards(
    cpuHand,
    board,
  );

  if (playableCards.length > 0) {
    return {
      type: "play",
      card: playableCards[0],
    };
  }

  if (remainingPasses > 0) {
    return {
      type: "pass",
    };
  }

  return {
    type: "none",
  };
}