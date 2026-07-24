function getRankLabel(rank) {
  if (rank === 1) return "A";
  if (rank === 11) return "J";
  if (rank === 12) return "Q";
  if (rank === 13) return "K";

  return String(rank);
}

function EmptyCardSlot({
  suit,
  rank,
  playable = false,
}) {
  return (
    <div
      className={`emptyCardSlot ${
        playable ? "playableEmptySlot" : ""
      }`}
      data-board-suit={suit}
      data-board-rank={rank}
    >
      {getRankLabel(rank)}
    </div>
  );
}

export default EmptyCardSlot;