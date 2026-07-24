import PlayingCard from "./PlayingCard";

function PlayerHand({
  sortedHand,
  openingDone,
  currentPlayerIndex,
  board,
  selectedCard,
  burstPlayers,
  burstCardCounts,
  isPlayable,
  onSelectCard,
  onPlayCard,
}) {
  const isBurstPlayer = burstPlayers.includes(0);

  return (
    <div
      className={`playerHand ${
        isBurstPlayer ? "burstPlayerHand" : ""
      }`}
      data-count={sortedHand.length}
    >
      {isBurstPlayer && (
        <div className="playerBurstDisplay">
          <span className="playerBurstTitle">
            バースト
          </span>

          <span className="playerBurstCount">
            <strong>{burstCardCounts[0]}</strong>
            <small>枚</small>
          </span>
        </div>
      )}

      <div className="playerHandTrack">
        {sortedHand.map((card, index) => {
          const playable =
            openingDone &&
            currentPlayerIndex === 0 &&
            isPlayable(card, board);

          const selected =
            selectedCard?.suit === card.suit &&
            selectedCard?.rank === card.rank;

          return (
            <PlayingCard
              key={`${card.suit}-${card.rank}`}
              suit={card.suit}
              rank={card.rank}
              playable={playable}
              selected={selected}
              style={{
                "--hand-index": index,
                zIndex: index + 1,
              }}
              onClick={
                playable
                  ? () => {
                      if (selected) {
                        onPlayCard();
                      } else {
                        onSelectCard(card);
                      }
                    }
                  : undefined
              }
            />
          );
        })}
      </div>
    </div>
  );
}

export default PlayerHand;