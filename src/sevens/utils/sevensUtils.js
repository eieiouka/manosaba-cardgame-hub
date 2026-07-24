export function isPlayable(card, board) {
  const playedCards = board[card.suit] ?? [];
  const playedRankSet = new Set(playedCards);

  // 7がまだ置かれていない列では、7だけを出せる
  if (!playedRankSet.has(7)) {
    return card.rank === 7;
  }

  // バーストで離れた位置に置かれた札は無視し、
  // 7から連続してつながっている範囲だけを調べる
  let connectedLowest = 7;
  let connectedHighest = 7;

  while (playedRankSet.has(connectedLowest - 1)) {
    connectedLowest -= 1;
  }

  while (playedRankSet.has(connectedHighest + 1)) {
    connectedHighest += 1;
  }

  return (
    card.rank === connectedLowest - 1 ||
    card.rank === connectedHighest + 1
  );
}

export function getNextPlayerIndex(
  currentPlayerIndex,
  burstPlayers = [],
) {
  for (let offset = 1; offset <= 4; offset += 1) {
    const nextPlayerIndex =
      (currentPlayerIndex + offset) % 4;

    if (!burstPlayers.includes(nextPlayerIndex)) {
      return nextPlayerIndex;
    }
  }

  return currentPlayerIndex;
}

export function getElementCenterRelativeTo(
  element,
  ancestor,
) {
  let left = 0;
  let top = 0;
  let currentElement = element;

  while (
    currentElement &&
    currentElement !== ancestor
  ) {
    left += currentElement.offsetLeft;
    top += currentElement.offsetTop;
    currentElement = currentElement.offsetParent;
  }

  if (currentElement !== ancestor) {
    return null;
  }

  return {
    left: left + element.offsetWidth / 2,
    top: top + element.offsetHeight / 2,
  };
}