import { useEffect, useRef } from "react";

import { chooseCpuAction } from "../sevensCpu";

export default function useCpuTurn({
  openingDone,
  currentPlayerIndex,
  board,
  cpuHands,
  cpuPasses,
  winnerIndex,
  flyingCards,
  burstPlayers,
  passPopupPlayerIndex,
  hand,

  isPlayable,
  getNextPlayerIndex,
  burstPlayer,
  animateCardToBoard,
  playFinishVoice,
  showPassPopupThenAdvance,

  setCpuHands,
  setBoard,
  setCpuPasses,
  setWinnerType,
  setWinnerIndex,
  setCurrentPlayerIndex,
}) {
  /*
   * Sevens.jsx内で作られる関数は、
   * 再描画のたびに新しい関数になる。
   *
   * それをそのままCPU処理の依存配列へ入れると、
   * タイマーが頻繁に作り直されるため、
   * refを経由して最新の関数を使用する。
   */
  const functionsRef = useRef({
    isPlayable,
    getNextPlayerIndex,
    burstPlayer,
    animateCardToBoard,
    playFinishVoice,
    showPassPopupThenAdvance,
  });

  useEffect(() => {
    functionsRef.current = {
      isPlayable,
      getNextPlayerIndex,
      burstPlayer,
      animateCardToBoard,
      playFinishVoice,
      showPassPopupThenAdvance,
    };
  }, [
    isPlayable,
    getNextPlayerIndex,
    burstPlayer,
    animateCardToBoard,
    playFinishVoice,
    showPassPopupThenAdvance,
  ]);

  useEffect(() => {
    if (!openingDone) {
      return undefined;
    }

    if (winnerIndex !== null) {
      return undefined;
    }

    if (flyingCards.length > 0) {
      return undefined;
    }

    if (passPopupPlayerIndex !== null) {
      return undefined;
    }

    const {
      isPlayable: checkPlayable,
      getNextPlayerIndex: getNextPlayer,
      burstPlayer: burstCurrentPlayer,
      animateCardToBoard: animateCard,
      playFinishVoice: playFinish,
      showPassPopupThenAdvance: showPassPopup,
    } = functionsRef.current;

    if (burstPlayers.includes(currentPlayerIndex)) {
      setCurrentPlayerIndex(
        getNextPlayer(
          currentPlayerIndex,
          burstPlayers,
        ),
      );

      return undefined;
    }

    if (currentPlayerIndex === 0) {
      return undefined;
    }

    const cpuIndex = currentPlayerIndex - 1;

    const cpuTimer = window.setTimeout(() => {
      const cpuHand = cpuHands[cpuIndex];
      const remainingPasses = cpuPasses[cpuIndex];

      if (!cpuHand) {
        return;
      }

      const hasPlayableCard = cpuHand.some((card) =>
        checkPlayable(card, board),
      );

      if (
        remainingPasses === 0 &&
        !hasPlayableCard &&
        cpuHand.length > 0
      ) {
        burstCurrentPlayer({
          playerIndex: currentPlayerIndex,
          cards: cpuHand,
        });

        return;
      }

      const otherPlayerHandCounts = [];

      if (!burstPlayers.includes(0)) {
        otherPlayerHandCounts.push(hand.length);
      }

      cpuHands.forEach(
        (otherCpuHand, otherCpuIndex) => {
          const otherPlayerIndex =
            otherCpuIndex + 1;

          if (
            otherCpuIndex !== cpuIndex &&
            !burstPlayers.includes(
              otherPlayerIndex,
            )
          ) {
            otherPlayerHandCounts.push(
              otherCpuHand.length,
            );
          }
        },
      );

      const action = chooseCpuAction({
        cpuHand,
        board,
        remainingPasses,
        otherPlayerHandCounts,
      });

      /*
       * CPU側の判定が古くても、
       * 実際に出す直前に出せるカードか確認する。
       */
      const playableCpuCards = cpuHand.filter(
        (card) => checkPlayable(card, board),
      );

      let validatedAction;

      if (
        action.type === "play" &&
        action.card &&
        checkPlayable(action.card, board)
      ) {
        validatedAction = action;
      } else if (
        action.type === "pass" &&
        remainingPasses > 0
      ) {
        validatedAction = action;
      } else if (playableCpuCards.length > 0) {
        validatedAction = {
          type: "play",
          card: playableCpuCards[0],
        };
      } else if (remainingPasses > 0) {
        validatedAction = {
          type: "pass",
        };
      } else {
        validatedAction = {
          type: "none",
        };
      }

      if (validatedAction.type === "play") {
        const playedCard =
          validatedAction.card;

        const nextCpuHand = cpuHand.filter(
          (card) =>
            card.suit !== playedCard.suit ||
            card.rank !== playedCard.rank,
        );

        // 飛行開始前にCPUの手札から消す
        setCpuHands((currentCpuHands) =>
          currentCpuHands.map(
            (currentCpuHand, index) =>
              index === cpuIndex
                ? nextCpuHand
                : currentCpuHand,
          ),
        );

        animateCard({
          card: playedCard,
          ownerIndex: currentPlayerIndex,

          onLanding: () => {
            // 到着後に盤面へ置く
            setBoard((currentBoard) => ({
              ...currentBoard,
              [playedCard.suit]: [
                ...currentBoard[
                  playedCard.suit
                ],
                playedCard.rank,
              ],
            }));

            if (nextCpuHand.length === 0) {
              playFinish(currentPlayerIndex);
              setWinnerType("finished");
              setWinnerIndex(
                currentPlayerIndex,
              );
              return;
            }

            setCurrentPlayerIndex(
              getNextPlayer(
                currentPlayerIndex,
                burstPlayers,
              ),
            );
          },
        });

        return;
      }

      if (validatedAction.type === "pass") {
        setCpuPasses((currentCpuPasses) =>
          currentCpuPasses.map(
            (remaining, index) =>
              index === cpuIndex
                ? Math.max(0, remaining - 1)
                : remaining,
          ),
        );

        showPassPopup(currentPlayerIndex);
        return;
      }

      setCurrentPlayerIndex(
        getNextPlayer(
          currentPlayerIndex,
          burstPlayers,
        ),
      );
    }, 10);

    return () => {
      window.clearTimeout(cpuTimer);
    };
  }, [
    openingDone,
    currentPlayerIndex,
    board,
    cpuHands,
    cpuPasses,
    winnerIndex,
    flyingCards,
    burstPlayers,
    passPopupPlayerIndex,
    hand,
    setCpuHands,
    setBoard,
    setCpuPasses,
    setWinnerType,
    setWinnerIndex,
    setCurrentPlayerIndex,
  ]);
}