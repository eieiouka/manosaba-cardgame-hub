const ROUND_SCORE_STORAGE_KEY =
  "manosaba-sevens-round-scores";

const ROUND_NUMBER_STORAGE_KEY =
  "manosaba-sevens-round-number";

const TOTAL_ROUNDS = 7;

export default function useRoundFlow({
  roundResult,
  savedRoundScores,
  currentRound,
  playChampionVoice,
  onRestart,
  setSavedRoundScores,
  setCurrentRound,
  setRoundResult,
  setFinalResultVisible,
  setWinnerType,
  setWinnerIndex,
  roundRecordedRef,
}) {
  const saveCurrentRoundResult = () => {
    if (!roundResult) {
      return savedRoundScores;
    }

    const alreadySaved = savedRoundScores.some(
      (savedRound) =>
        savedRound.roundNumber ===
        roundResult.roundNumber,
    );

    if (alreadySaved) {
      return savedRoundScores;
    }

    const nextSavedRoundScores = [
      ...savedRoundScores,
      roundResult,
    ];

    setSavedRoundScores(nextSavedRoundScores);

    window.sessionStorage.setItem(
      ROUND_SCORE_STORAGE_KEY,
      JSON.stringify(nextSavedRoundScores),
    );

    return nextSavedRoundScores;
  };

  const goToNextRound = () => {
    if (!roundResult) {
      return;
    }

    saveCurrentRoundResult();

    const nextRound = Math.min(
      TOTAL_ROUNDS,
      currentRound + 1,
    );

    window.sessionStorage.setItem(
      ROUND_NUMBER_STORAGE_KEY,
      String(nextRound),
    );

    onRestart();
  };

  const showFinalResult = () => {
    const allRoundScores =
      saveCurrentRoundResult();

    const totalScores = [0, 1, 2, 3].map(
      (playerIndex) =>
        allRoundScores.reduce(
          (total, savedRound) =>
            total +
            (
              savedRound.players[playerIndex]
                ?.total ?? 0
            ),
          0,
        ),
    );

    const highestScore = Math.max(
      ...totalScores,
    );

    const championPlayerIndex =
      totalScores.findIndex(
        (score) => score === highestScore,
      );

    setFinalResultVisible(true);
    playChampionVoice(championPlayerIndex);
  };

  const restartGame = () => {
    window.sessionStorage.removeItem(
      ROUND_SCORE_STORAGE_KEY,
    );

    window.sessionStorage.removeItem(
      ROUND_NUMBER_STORAGE_KEY,
    );

    setSavedRoundScores([]);
    setCurrentRound(1);
    setRoundResult(null);
    setFinalResultVisible(false);
    setWinnerType(null);
    setWinnerIndex(null);

    roundRecordedRef.current = false;

    onRestart();
  };

  return {
    goToNextRound,
    showFinalResult,
    restartGame,
  };
}