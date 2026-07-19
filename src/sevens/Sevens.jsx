import { useMemo, useState } from "react";
import "./Sevens.css";

const suits = [
  {
    id: "spades",
    symbol: "♠",
    fileNumber: 1,
  },
  {
    id: "hearts",
    symbol: "♥",
    fileNumber: 2,
  },
  {
    id: "diamonds",
    symbol: "♦",
    fileNumber: 3,
  },
  {
    id: "clubs",
    symbol: "♣",
    fileNumber: 4,
  },
];

const initialBoard = {
  spades: [7],
  hearts: [7],
  diamonds: [7],
  clubs: [7],
};

const initialHand = [
  { suit: "spades", rank: 3 },
  { suit: "spades", rank: 6 },
  { suit: "spades", rank: 8 },

  { suit: "hearts", rank: 6 },
  { suit: "hearts", rank: 8 },

  { suit: "diamonds", rank: 2 },
  { suit: "diamonds", rank: 6 },
  { suit: "diamonds", rank: 8 },

  { suit: "clubs", rank: 6 },
  { suit: "clubs", rank: 8 },
];

function getRankFileName(rank) {
  if (rank === 1) return "A";
  if (rank === 10) return "T";
  if (rank === 11) return "J";
  if (rank === 12) return "Q";
  if (rank === 13) return "K";

  return String(rank);
}

function getCardImagePath(suitId, rank) {
  const suit = suits.find((item) => item.id === suitId);

  if (!suit) {
    return "";
  }

  const rankName = getRankFileName(rank);

  return `/cards/card_${rankName}${suit.fileNumber}.png`;
}

function getRankLabel(rank) {
  if (rank === 1) return "A";
  if (rank === 11) return "J";
  if (rank === 12) return "Q";
  if (rank === 13) return "K";

  return String(rank);
}

function isPlayable(card, board) {
  const playedCards = board[card.suit];

  if (!playedCards || playedCards.length === 0) {
    return card.rank === 7;
  }

  const lowest = Math.min(...playedCards);
  const highest = Math.max(...playedCards);

  return card.rank === lowest - 1 || card.rank === highest + 1;
}

function PlayingCard({
  suit,
  rank,
  onClick,
  selected = false,
  playable = false,
  small = false,
  style,
}) {
  const [imageFailed, setImageFailed] = useState(false);

  const suitData = suits.find((item) => item.id === suit);

  const className = [
    "sevensCard",
    selected ? "selectedCard" : "",
    playable ? "playableCard" : "",
    small ? "smallCard" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={className}
      style={style}
      onClick={onClick}
      disabled={!onClick}
      aria-label={`${suitData?.symbol ?? ""}${getRankLabel(rank)}`}
    >
      {!imageFailed ? (
        <img
          src={getCardImagePath(suit, rank)}
          alt={`${suitData?.symbol ?? ""}${getRankLabel(rank)}`}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div
          className={`fallbackCard ${
            suitData?.id === "hearts" || suitData?.id === "diamonds"
              ? "fallbackRed"
              : "fallbackBlack"
          }`}
        >
          <div className="fallbackCorner">
            <span>{getRankLabel(rank)}</span>
            <strong>{suitData?.symbol}</strong>
          </div>

          <div className="fallbackCenter">{suitData?.symbol}</div>

          <div className="fallbackCorner fallbackBottom">
            <span>{getRankLabel(rank)}</span>
            <strong>{suitData?.symbol}</strong>
          </div>
        </div>
      )}
    </button>
  );
}

function EmptyCardSlot({ rank, playable = false }) {
  return (
    <div
      className={`emptyCardSlot ${
        playable ? "playableEmptySlot" : ""
      }`}
    >
      {getRankLabel(rank)}
    </div>
  );
}

function Sevens({ navigate }) {
  const [board, setBoard] = useState(initialBoard);
  const [hand, setHand] = useState(initialHand);
  const [selectedCard, setSelectedCard] = useState(null);
  const [passes, setPasses] = useState(3);

  const sortedHand = useMemo(() => {
    const suitOrder = {
      spades: 1,
      hearts: 2,
      diamonds: 3,
      clubs: 4,
    };

    return [...hand].sort((cardA, cardB) => {
      const suitDifference =
        suitOrder[cardA.suit] - suitOrder[cardB.suit];

      if (suitDifference !== 0) {
        return suitDifference;
      }

      return cardA.rank - cardB.rank;
    });
  }, [hand]);

  const selectCard = (card) => {
    if (!isPlayable(card, board)) {
      return;
    }

    setSelectedCard(card);
  };

  const playCard = () => {
    if (!selectedCard) {
      return;
    }

    if (!isPlayable(selectedCard, board)) {
      setSelectedCard(null);
      return;
    }

    setBoard((currentBoard) => ({
      ...currentBoard,
      [selectedCard.suit]: [
        ...currentBoard[selectedCard.suit],
        selectedCard.rank,
      ],
    }));

    setHand((currentHand) =>
      currentHand.filter(
        (card) =>
          card.suit !== selectedCard.suit ||
          card.rank !== selectedCard.rank,
      ),
    );

    setSelectedCard(null);
  };

  const passTurn = () => {
    if (passes <= 0) {
      return;
    }

    setPasses((current) => current - 1);
    setSelectedCard(null);
  };

  const restartGame = () => {
    setBoard(initialBoard);
    setHand(initialHand);
    setSelectedCard(null);
    setPasses(3);
  };

  return (
    <main className="sevensPage">
      <header className="sevensHeader">
        <button
          type="button"
          className="backButton"
          onClick={() => navigate("/")}
        >
          ← HUBへ戻る
        </button>

        <div className="sevensTitle">
          <span>MANOSABA CARD GAMES</span>
          <h1>SEVENS</h1>
          <p>七並べ</p>
        </div>

        <button
          type="button"
          className="restartButton"
          onClick={restartGame}
        >
          やり直す
        </button>
      </header>

      <section className="sevensTable">
        <section className="opponentsTopRow">
          <section className="opponent">
            <p>PLAYER 2</p>
            <span>残り11枚</span>
          </section>

          <section className="opponent">
            <p>PLAYER 3</p>
            <span>残り10枚</span>
          </section>

          <section className="opponent">
            <p>PLAYER 4</p>
            <span>残り10枚</span>
          </section>
        </section>

        <section className="board">
          {suits.map((suit) => (
            <div className="boardRow" key={suit.id}>
              <div
                className={`boardSuit ${
                  suit.id === "hearts" || suit.id === "diamonds"
                    ? "redSuit"
                    : "blackSuit"
                }`}
              >
                {suit.symbol}
              </div>

              <div className="boardCards">
                {Array.from({ length: 13 }, (_, index) => {
                  const rank = index + 1;
                  const played = board[suit.id].includes(rank);

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
                      rank={rank}
                      playable={playableSlot}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        <section className="playerArea">
          <div className="playerHand">
            {sortedHand.map((card, index) => {
              const playable = isPlayable(card, board);

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
                  style={{ zIndex: index + 1 }}
                  onClick={() => selectCard(card)}
                />
              );
            })}
          </div>

          <div className="actionButtons">
            <button
              type="button"
              className="playCardButton"
              onClick={playCard}
              disabled={!selectedCard}
            >
              カードを出す
            </button>

            <button
              type="button"
              className="passButton"
              onClick={passTurn}
              disabled={passes <= 0}
            >
              パス 残り{passes}回
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}

export default Sevens;