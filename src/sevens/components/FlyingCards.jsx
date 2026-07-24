import PlayingCard from "./PlayingCard";

function FlyingCards({
  flyingCards,
  openingSourcePositions,
}) {
  return (
    <>
      {flyingCards.map((flyingCard) => (
        <div
          key={flyingCard.id}
          className="openingFlyingCard"
          style={{
            "--opening-start-left":
              openingSourcePositions[
                flyingCard.ownerIndex
              ]?.left ?? "50%",

            "--opening-start-top":
              openingSourcePositions[
                flyingCard.ownerIndex
              ]?.top ?? "50%",

            "--opening-end-left":
              `${flyingCard.targetLeft}px`,

            "--opening-end-top":
              `${flyingCard.targetTop}px`,
          }}
        >
          <PlayingCard
            suit={flyingCard.suit}
            rank={flyingCard.rank}
            small
          />
        </div>
      ))}
    </>
  );
}

export default FlyingCards;