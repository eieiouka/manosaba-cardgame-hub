function OpponentArea({
  opponents,
  openingDone,
  currentPlayerIndex,
  burstPlayers,
  burstCardCounts,
  cpuHands,
  cpuPasses,
  passPopupPlayerIndex,
}) {
  return (
    <section
      className="opponentsTopRow"
      aria-label="対戦相手"
    >
      {opponents.map((opponent, opponentIndex) => {
        const playerIndex = opponentIndex + 1;

        const isCurrentOpponent =
          openingDone &&
          currentPlayerIndex === playerIndex;

        const isBurstOpponent =
          burstPlayers.includes(playerIndex);

        return (
          <section
            className={`opponent ${opponent.position} ${
              isCurrentOpponent
                ? "currentOpponent"
                : ""
            } ${
              isBurstOpponent
                ? "burstOpponent"
                : ""
            }`}
            key={opponent.id}
          >
            {passPopupPlayerIndex === playerIndex && (
              <div
                className="passPopup"
                role="status"
              >
                パス
              </div>
            )}

            <img
              className="opponentIcon"
              src={opponent.image}
              alt={opponent.name}
            />

            <div className="opponentInfoRow">
              <span className="opponentRemaining">
                残り
                {isBurstOpponent
                  ? burstCardCounts[playerIndex]
                  : cpuHands[opponentIndex].length}
                枚
              </span>

              <div
                className="opponentPasses"
                aria-label={`残りパス${cpuPasses[opponentIndex]}回`}
              >
                {Array.from(
                  { length: 3 },
                  (_, passIndex) => (
                    <span
                      key={passIndex}
                      className={`opponentPassIcon ${
                        passIndex <
                        cpuPasses[opponentIndex]
                          ? "passAvailable"
                          : "passUsed"
                      }`}
                    >
                      ●
                    </span>
                  ),
                )}
              </div>
            </div>
          </section>
        );
      })}
    </section>
  );
}

export default OpponentArea;