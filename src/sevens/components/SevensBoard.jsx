import PlayingCard from "./PlayingCard";
import EmptyCardSlot from "./EmptyCardSlot";

function SevensBoard({
  suits,
  board,
  isPlayable,
}) {
  return (
    <section className="board">
      {suits.map((suit) => (
        <div className="boardRow" key={suit.id}>
          <div
            className={`boardSuit ${
              suit.id === "hearts" ||
              suit.id === "diamonds"
                ? "redSuit"
                : "blackSuit"
            }`}
          >
            {suit.symbol}
          </div>

          <div className="boardCards">
            {Array.from(
              { length: 13 },
              (_, index) => {
                const rank = index + 1;

                const played =
                  board[suit.id].includes(rank);

                if (played) {
                  return (
                    <PlayingCard
                      key={`${suit.id}-${rank}`}
                      suit={suit.id}
                      rank={rank}
                      small
                    />
                  );
                }

                const playableSlot = isPlayable(
                  {
                    suit: suit.id,
                    rank,
                  },
                  board,
                );

                return (
                  <EmptyCardSlot
                    key={`${suit.id}-${rank}`}
                    suit={suit.id}
                    rank={rank}
                    playable={playableSlot}
                  />
                );
              },
            )}
          </div>
        </div>
      ))}
    </section>
  );
}

export default SevensBoard;