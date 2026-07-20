import "./ResultScreen.css";

const PLAYER_NAMES = [
  "あなた",
  "桜羽エマ",
  "橘シェリー",
  "遠野ハンナ",
];

function ResultScreen({
  winnerIndex,
  onRestart,
}) {
  const playerWon = winnerIndex === 0;
  const winnerName =
    PLAYER_NAMES[winnerIndex] ?? "不明";

  return (
    <div
      className="resultScreenOverlay"
      role="dialog"
      aria-modal="true"
      aria-label="ゲーム結果"
    >
      <div
        className={`resultScreenPanel ${
          playerWon
            ? "playerVictory"
            : "playerDefeat"
        }`}
      >
        <p className="resultScreenLabel">
          GAME RESULT
        </p>

        <h2 className="resultScreenTitle">
          {playerWon ? "YOU WIN" : "YOU LOSE"}
        </h2>

        <p className="resultScreenWinner">
          {winnerName}の勝利
        </p>

        <button
          type="button"
          className="resultRestartButton"
          onClick={onRestart}
        >
          もう一度遊ぶ
        </button>
      </div>
    </div>
  );
}

export default ResultScreen;