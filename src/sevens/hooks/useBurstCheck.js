import { useEffect } from "react";

export default function useBurstCheck({
  openingDone,
  winnerIndex,
  flyingCards,
  passPopupPlayerIndex,
  currentPlayerIndex,
  burstPlayers,
  hand,
  board,
  passes,
  isPlayable,
  burstPlayer,
}) {
  useEffect(() => {
    if (!openingDone) {
      return;
    }

    if (winnerIndex !== null) {
      return;
    }

    if (flyingCards.length > 0) {
      return;
    }

    // パス表示中は、まだ手番を移動している途中なので
    // バースト判定を行わない
    if (passPopupPlayerIndex !== null) {
      return;
    }

    if (currentPlayerIndex !== 0) {
      return;
    }

    if (burstPlayers.includes(0)) {
      return;
    }

    const hasPlayableCard = hand.some((card) =>
      isPlayable(card, board),
    );

    if (
      passes === 0 &&
      !hasPlayableCard &&
      hand.length > 0
    ) {
      burstPlayer({
        playerIndex: 0,
        cards: hand,
      });
    }
  }, [
    openingDone,
    winnerIndex,
    flyingCards,
    passPopupPlayerIndex,
    currentPlayerIndex,
    burstPlayers,
    hand,
    board,
    passes,
    isPlayable,
    burstPlayer,
  ]);
}