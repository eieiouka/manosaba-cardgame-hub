export default function useCardAnimation({
  tableRef,
  burstPlayers,
  setBurstPlayers,
  setBurstCardCounts,
  setFlyingCards,
  setBoard,
  setHand,
  setCpuHands,
  setSelectedCard,
  setCurrentPlayerIndex,
  getNextPlayerIndex,
  getElementCenterRelativeTo,
  playCardPlaySound,
  playBurstVoice,
  setWinnerIndex,
  setWinnerType,
}) {
  const animateCardToBoard = ({
    card,
    ownerIndex,
    onLanding,
  }) => {
    const tableElement = tableRef.current;

    const targetElement =
      tableElement?.querySelector(
        `[data-board-suit="${card.suit}"][data-board-rank="${card.rank}"]`,
      );

    if (!tableElement || !targetElement) {
      onLanding();
      return;
    }

    const targetCenter =
      getElementCenterRelativeTo(
        targetElement,
        tableElement,
      );

    if (!targetCenter) {
      onLanding();
      return;
    }

    const flyingCardId =
      `normal-${ownerIndex}-${card.suit}-${card.rank}-${Date.now()}`;

    playCardPlaySound();

    setFlyingCards((currentFlyingCards) => [
      ...currentFlyingCards,
      {
        ...card,
        id: flyingCardId,
        ownerIndex,
        targetLeft: targetCenter.left,
        targetTop: targetCenter.top,
      },
    ]);

    window.setTimeout(() => {
      setFlyingCards((currentFlyingCards) =>
        currentFlyingCards.filter(
          (flyingCard) =>
            flyingCard.id !== flyingCardId,
        ),
      );

      onLanding();
    }, 600);
  };

  const burstPlayer = ({
    playerIndex,
    cards,
  }) => {
    if (cards.length === 0) {
      return;
    }

    playBurstVoice(playerIndex);

    const burstCardCount = cards.length;

    setBurstCardCounts((currentCounts) => ({
      ...currentCounts,
      [playerIndex]: burstCardCount,
    }));

    const tableElement = tableRef.current;

    const burstId =
      `burst-${playerIndex}-${Date.now()}`;

    const nextFlyingCards = cards
      .map((card, index) => {
        const targetElement =
          tableElement?.querySelector(
            `[data-board-suit="${card.suit}"][data-board-rank="${card.rank}"]`,
          );

        if (!tableElement || !targetElement) {
          return null;
        }

        const targetCenter =
          getElementCenterRelativeTo(
            targetElement,
            tableElement,
          );

        if (!targetCenter) {
          return null;
        }

        return {
          ...card,
          id: `${burstId}-${index}`,
          burstId,
          ownerIndex: playerIndex,
          targetLeft: targetCenter.left,
          targetTop: targetCenter.top,
        };
      })
      .filter(Boolean);

    // 飛行開始前に手札をすべて消す
    if (playerIndex === 0) {
      setHand([]);
      setSelectedCard(null);
    } else {
      const cpuIndex = playerIndex - 1;

      setCpuHands((currentCpuHands) =>
        currentCpuHands.map(
          (cpuHand, index) =>
            index === cpuIndex ? [] : cpuHand,
        ),
      );
    }

    const nextBurstPlayers = [
      ...burstPlayers,
      playerIndex,
    ].filter(
      (value, index, array) =>
        array.indexOf(value) === index,
    );

    setBurstPlayers(nextBurstPlayers);

    setFlyingCards((currentFlyingCards) => [
      ...currentFlyingCards,
      ...nextFlyingCards,
    ]);

    window.setTimeout(() => {
      setBoard((currentBoard) => {
        const nextBoard = {
          spades: [...currentBoard.spades],
          hearts: [...currentBoard.hearts],
          diamonds: [...currentBoard.diamonds],
          clubs: [...currentBoard.clubs],
        };

        cards.forEach((card) => {
          if (
            !nextBoard[card.suit].includes(card.rank)
          ) {
            nextBoard[card.suit].push(card.rank);
          }
        });

        Object.keys(nextBoard).forEach((suit) => {
          nextBoard[suit].sort(
            (rankA, rankB) => rankA - rankB,
          );
        });

        return nextBoard;
      });

      setFlyingCards((currentFlyingCards) =>
        currentFlyingCards.filter(
          (flyingCard) =>
            flyingCard.burstId !== burstId,
        ),
      );

      const remainingPlayers = [0, 1, 2, 3].filter(
        (playerIndexValue) =>
          !nextBurstPlayers.includes(
            playerIndexValue,
          ),
      );

      if (remainingPlayers.length === 1) {
        setWinnerType("survived");
        setWinnerIndex(remainingPlayers[0]);
        return;
      }

      setCurrentPlayerIndex(
        getNextPlayerIndex(
          playerIndex,
          nextBurstPlayers,
        ),
      );
    }, 600);
  };

  return {
    animateCardToBoard,
    burstPlayer,
  };
}