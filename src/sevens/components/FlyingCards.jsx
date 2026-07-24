import { memo } from "react";

const suitFileNumbers = {
  spades: 1,
  hearts: 2,
  diamonds: 3,
  clubs: 4,
};

function getRankFileName(rank) {
  if (rank === 1) {
    return "A";
  }

  if (rank === 10) {
    return "T";
  }

  if (rank === 11) {
    return "J";
  }

  if (rank === 12) {
    return "Q";
  }

  if (rank === 13) {
    return "K";
  }

  return String(rank);
}

function getCardImagePath(suit, rank) {
  const suitFileNumber =
    suitFileNumbers[suit];

  if (!suitFileNumber) {
    return "";
  }

  return `/cards/card_${getRankFileName(
    rank,
  )}${suitFileNumber}.png`;
}

function FlyingCards({
  flyingCards,
  openingSourcePositions,
}) {
  return (
    <>
      {flyingCards.map((flyingCard) => {
        const sourcePosition =
          openingSourcePositions[
            flyingCard.ownerIndex
          ];

        return (
          <div
            key={flyingCard.id}
            className="openingFlyingCard"
            style={{
              /*
                開始座標は元のまま
              */
              "--opening-start-left":
                sourcePosition?.left ??
                "50%",

              "--opening-start-top":
                sourcePosition?.top ??
                "50%",

              /*
                終了座標も元のまま
              */
              "--opening-end-left":
                `${flyingCard.targetLeft}px`,

              "--opening-end-top":
                `${flyingCard.targetTop}px`,
            }}
          >
            <img
              className="flyingCardImage"
              src={getCardImagePath(
                flyingCard.suit,
                flyingCard.rank,
              )}
              alt=""
              draggable={false}
              decoding="async"
            />
          </div>
        );
      })}
    </>
  );
}

export default memo(FlyingCards);