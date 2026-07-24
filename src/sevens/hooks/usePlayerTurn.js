import { useEffect } from "react";

export default function usePlayerTurn({
  openingDone,
  currentPlayerIndex,
  winnerIndex,
  board,
  hand,
  selectedCard,
  passes,
  burstPlayers,
  flyingCards,
  passPopupPlayerIndex,
  playerTurnCountRef,
  forcePlayerActionRef,
  isPlayable,
  animateCardToBoard,
  getNextPlayerIndex,
  showPassPopupThenAdvance,
  playFinishVoice,
  setHand,
  setSelectedCard,
  setBoard,
  setWinnerType,
  setWinnerIndex,
  setCurrentPlayerIndex,
  setPasses,
  setTurnSeconds,
}) {
  const selectCard = (card) => {
    if (flyingCards.length > 0) {
      return;
    }

    if (burstPlayers.includes(0)) {
      return;
    }

    if (!openingDone) {
      return;
    }

    if (currentPlayerIndex !== 0) {
      return;
    }

    if (!isPlayable(card, board)) {
      return;
    }

    setSelectedCard(card);
  };

  const playCard = (forcedCard = null) => {
    if (flyingCards.length > 0) {
      return;
    }

    if (burstPlayers.includes(0)) {
      return;
    }

    if (!openingDone) {
      return;
    }

    if (winnerIndex !== null) {
      return;
    }

    if (currentPlayerIndex !== 0) {
      return;
    }

    const playedCard = forcedCard ?? selectedCard;

    if (!playedCard) {
      return;
    }

    if (!isPlayable(playedCard, board)) {
      setSelectedCard(null);
      return;
    }

    const nextHand = hand.filter(
      (card) =>
        card.suit !== playedCard.suit ||
        card.rank !== playedCard.rank,
    );

    // 飛行開始前に手札から消す
    setHand(nextHand);
    setSelectedCard(null);
    playerTurnCountRef.current += 1;

    animateCardToBoard({
      card: playedCard,
      ownerIndex: 0,

      onLanding: () => {
        // 到着後に盤面へ置く
        setBoard((currentBoard) => ({
          ...currentBoard,
          [playedCard.suit]: [
            ...currentBoard[playedCard.suit],
            playedCard.rank,
          ],
        }));

        if (nextHand.length === 0) {
          playFinishVoice(0);
          setWinnerType("finished");
          setWinnerIndex(0);
          return;
        }

        setCurrentPlayerIndex(
          getNextPlayerIndex(
            0,
            burstPlayers,
          ),
        );
      },
    });
  };

  const passTurn = () => {
    if (passPopupPlayerIndex !== null) {
      return;
    }

    if (flyingCards.length > 0) {
      return;
    }

    if (burstPlayers.includes(0)) {
      return;
    }

    if (!openingDone) {
      return;
    }

    if (currentPlayerIndex !== 0) {
      return;
    }

    if (passes <= 0) {
      return;
    }

    setPasses((current) => current - 1);
    setSelectedCard(null);
    playerTurnCountRef.current += 1;

    showPassPopupThenAdvance(currentPlayerIndex);
  };

  forcePlayerActionRef.current = () => {
    if (
      passPopupPlayerIndex !== null ||
      flyingCards.length > 0 ||
      burstPlayers.includes(0) ||
      !openingDone ||
      winnerIndex !== null ||
      currentPlayerIndex !== 0
    ) {
      return;
    }

    const suitOrder = {
      spades: 1,
      hearts: 2,
      diamonds: 3,
      clubs: 4,
    };

    const leftmostPlayableCard = [...hand]
      .sort((cardA, cardB) => {
        const suitDifference =
          suitOrder[cardA.suit] -
          suitOrder[cardB.suit];

        if (suitDifference !== 0) {
          return suitDifference;
        }

        return cardA.rank - cardB.rank;
      })
      .find((card) =>
        isPlayable(card, board),
      );

    if (leftmostPlayableCard) {
      playCard(leftmostPlayableCard);
      return;
    }

    // 出せるカードがない場合だけ、時間切れを強制パスとして処理する。
    if (passes > 0) {
      passTurn();
    }
  };

  useEffect(() => {
    const isPlayerTurn =
      openingDone &&
      winnerIndex === null &&
      currentPlayerIndex === 0 &&
      !burstPlayers.includes(0) &&
      flyingCards.length === 0 &&
      passPopupPlayerIndex === null;

    if (!isPlayerTurn) {
      return undefined;
    }

    // 最初の自分の手だけは時間制限なし。
    if (playerTurnCountRef.current === 0) {
      return undefined;
    }

    const timeLimit = 3;
    const deadline =
      Date.now() + timeLimit * 1000;

    setTurnSeconds(timeLimit);

    const countdownTimer =
      window.setInterval(() => {
        const nextSeconds = Math.max(
          0,
          Math.ceil(
            (deadline - Date.now()) / 1000,
          ),
        );

        setTurnSeconds(nextSeconds);
      }, 100);

    const forceActionTimer =
      window.setTimeout(() => {
        setTurnSeconds(0);
        forcePlayerActionRef.current?.();
      }, timeLimit * 1000);

    return () => {
      window.clearInterval(countdownTimer);
      window.clearTimeout(forceActionTimer);
    };
  }, [
    openingDone,
    winnerIndex,
    currentPlayerIndex,
    burstPlayers,
    flyingCards.length,
    passPopupPlayerIndex,
  ]);

  return {
    selectCard,
    playCard,
    passTurn,
  };
}