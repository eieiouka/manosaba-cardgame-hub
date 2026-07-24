import { useState } from "react";

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

function getRankFileName(rank) {
  if (rank === 1) return "A";
  if (rank === 10) return "T";
  if (rank === 11) return "J";
  if (rank === 12) return "Q";
  if (rank === 13) return "K";

  return String(rank);
}

function getCardImagePath(suitId, rank) {
  const suit = suits.find(
    (item) => item.id === suitId,
  );

  if (!suit) {
    return "";
  }

  return `/cards/card_${getRankFileName(rank)}${suit.fileNumber}.png`;
}

function getRankLabel(rank) {
  if (rank === 1) return "A";
  if (rank === 11) return "J";
  if (rank === 12) return "Q";
  if (rank === 13) return "K";

  return String(rank);
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
  const [imageFailed, setImageFailed] =
    useState(false);

  const suitData = suits.find(
    (item) => item.id === suit,
  );

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
          onError={() => {
            setImageFailed(true);
          }}
        />
      ) : (
        <div
          className={`fallbackCard ${
            suitData?.id === "hearts" ||
            suitData?.id === "diamonds"
              ? "fallbackRed"
              : "fallbackBlack"
          }`}
        >
          <div className="fallbackCorner">
            <span>{getRankLabel(rank)}</span>
            <strong>{suitData?.symbol}</strong>
          </div>

          <div className="fallbackCenter">
            {suitData?.symbol}
          </div>

          <div className="fallbackCorner fallbackBottom">
            <span>{getRankLabel(rank)}</span>
            <strong>{suitData?.symbol}</strong>
          </div>
        </div>
      )}
    </button>
  );
}

export default PlayingCard;