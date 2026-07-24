function TurnControls({
  openingDone,
  currentPlayerIndex,
  flyingCards,
  passPopupPlayerIndex,
  burstPlayers,
  selectedCard,
  passes,
  turnSeconds,
  isFirstPlayerTurn,
  onPlayCard,
  onPassTurn,
}) {
  const isPlayerTurn =
    openingDone &&
    currentPlayerIndex === 0;

  const isActionLocked =
    passPopupPlayerIndex !== null ||
    flyingCards.length > 0 ||
    burstPlayers.includes(0) ||
    !openingDone ||
    currentPlayerIndex !== 0;

  const showCountdown =
    openingDone &&
    currentPlayerIndex === 0 &&
    flyingCards.length === 0 &&
    passPopupPlayerIndex === null;

  return (
    <div
      className={`actionButtons ${
        isPlayerTurn ? "playerTurn" : ""
      }`}
    >
      <button
        type="button"
        className="playCardButton"
        onClick={onPlayCard}
        disabled={
          isActionLocked ||
          !selectedCard
        }
      >
        <span className="playButtonLabel">
          カードを出す
        </span>

        {showCountdown && (
          <>
            <strong className="turnCountdown">
              {isFirstPlayerTurn
                ? "－"
                : turnSeconds}
            </strong>

            <span className="turnCountdownUnit">
              秒
            </span>
          </>
        )}
      </button>

      <button
        type="button"
        className="passButton"
        onClick={onPassTurn}
        disabled={
          isActionLocked ||
          passes <= 0
        }
      >
        <span className="passButtonLabel">
          パス
        </span>

        <span className="passRemainingLabel">
          残り
        </span>

        <span className="passCount">
          <strong>{passes}</strong>
          <small>回</small>
        </span>
      </button>
    </div>
  );
}

export default TurnControls;