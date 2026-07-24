import { useEffect } from "react";

export default function useOpeningAnimation({
  openingDone,
  openingSevens,
  firstPlayerIndex,
  tableRef,
  getElementCenterRelative,
  playCardPlaySound,
  setHand,
  setCpuHands,
  setFlyingCards,
  setBoard,
  setCurrentPlayerIndex,
  setOpeningDone,
}) {
  useEffect(() => {
    if (openingDone) {
      return undefined;
    }

    if (!openingSevens || openingSevens.length === 0) {
      setCurrentPlayerIndex(firstPlayerIndex);
      setOpeningDone(true);
      return undefined;
    }

    let cancelled = false;
    const timers = [];

    const suitOrder = {
      spades: 0,
      hearts: 1,
      diamonds: 2,
      clubs: 3,
    };

    const orderedSevens = [...openingSevens].sort(
      (cardA, cardB) =>
        suitOrder[cardA.suit] -
        suitOrder[cardB.suit],
    );

    const launchInterval = 600;
    const flightDuration = 600;

    orderedSevens.forEach((card, index) => {
      const launchTimer = window.setTimeout(() => {
        if (cancelled) {
          return;
        }

        const tableElement = tableRef.current;

        const targetElement =
          tableElement?.querySelector(
            `[data-board-suit="${card.suit}"][data-board-rank="7"]`,
          );

        if (!tableElement || !targetElement) {
          return;
        }

        const targetCenter =
          getElementCenterRelative(
            targetElement,
            tableElement,
          );

        if (!targetCenter) {
          return;
        }

        /*
         * 7を飛ばし始める前に、
         * 所有者の手札から7を削除する。
         */
        if (card.ownerIndex === 0) {
          setHand((currentHand) =>
            currentHand.filter(
              (handCard) =>
                handCard.suit !== card.suit ||
                handCard.rank !== 7,
            ),
          );
        } else {
          const cpuIndex = card.ownerIndex - 1;

          setCpuHands((currentCpuHands) =>
            currentCpuHands.map(
              (cpuHand, currentCpuIndex) => {
                if (currentCpuIndex !== cpuIndex) {
                  return cpuHand;
                }

                return cpuHand.filter(
                  (handCard) =>
                    handCard.suit !== card.suit ||
                    handCard.rank !== 7,
                );
              },
            ),
          );
        }

        const flyingCardId =
          `opening-${card.ownerIndex}-${card.suit}-7-${index}`;

        playCardPlaySound();

        setFlyingCards((currentFlyingCards) => [
          ...currentFlyingCards,
          {
            ...card,
            id: flyingCardId,
            targetLeft: targetCenter.left,
            targetTop: targetCenter.top,
          },
        ]);
      }, index * launchInterval);

      const landingTimer = window.setTimeout(() => {
        if (cancelled) {
          return;
        }

        setBoard((currentBoard) => {
          if (currentBoard[card.suit]?.includes(7)) {
            return currentBoard;
          }

          return {
            ...currentBoard,
            [card.suit]: [
              ...currentBoard[card.suit],
              7,
            ],
          };
        });

        const flyingCardId =
          `opening-${card.ownerIndex}-${card.suit}-7-${index}`;

        setFlyingCards((currentFlyingCards) =>
          currentFlyingCards.filter(
            (flyingCard) =>
              flyingCard.id !== flyingCardId,
          ),
        );
      }, index * launchInterval + flightDuration);

      timers.push(launchTimer, landingTimer);
    });

    const finishTimer = window.setTimeout(() => {
      if (cancelled) {
        return;
      }

      setFlyingCards([]);
      setCurrentPlayerIndex(firstPlayerIndex);
      setOpeningDone(true);
    }, orderedSevens.length * launchInterval + 100);

    timers.push(finishTimer);

    return () => {
      cancelled = true;

      timers.forEach((timer) => {
        window.clearTimeout(timer);
      });
    };
  }, [
    openingDone,
    openingSevens,
    firstPlayerIndex,
    tableRef,
    getElementCenterRelative,
    playCardPlaySound,
    setHand,
    setCpuHands,
    setFlyingCards,
    setBoard,
    setCurrentPlayerIndex,
    setOpeningDone,
  ]);
}