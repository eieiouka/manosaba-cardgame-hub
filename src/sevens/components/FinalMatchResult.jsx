const TOTAL_ROUNDS = 7;

const playerNames = [
  "黒部ナノカ（You）",
  "桜羽エマ",
  "橘シェリー",
  "遠野ハンナ",
];

const playerIllustrations = [
  "/result/nanoka.png",
  "/result/ema.png",
  "/result/sherry.png",
  "/result/hanna.png",
];

function formatScore(score) {
  if (score > 0) {
    return `+${score}`;
  }

  return String(score);
}

function FinalMatchResult({
  savedRoundScores,
  roundResult,
  onRestart,
  onBackToHub,
}) {
  /*
    7回戦目がまだsavedRoundScoresへ反映されていない瞬間でも、
    roundResultを加えて必ず全7回戦を集計する。
  */
  const allRoundScores = [...savedRoundScores];

  const currentRoundAlreadySaved =
    allRoundScores.some(
      (savedRound) =>
        savedRound.roundNumber ===
        roundResult?.roundNumber,
    );

  if (roundResult && !currentRoundAlreadySaved) {
    allRoundScores.push(roundResult);
  }

  allRoundScores.sort(
    (roundA, roundB) =>
      roundA.roundNumber - roundB.roundNumber,
  );

  const totalScores = [0, 1, 2, 3].map(
    (playerIndex) =>
      allRoundScores.reduce(
        (total, savedRound) =>
          total +
          (savedRound.players[playerIndex]?.total ??
            0),
        0,
      ),
  );

  const sortedPlayers = playerNames
    .map((playerName, playerIndex) => ({
      playerIndex,
      playerName,
      totalScore: totalScores[playerIndex],
    }))
    .sort((playerA, playerB) => {
      if (
        playerB.totalScore !==
        playerA.totalScore
      ) {
        return (
          playerB.totalScore -
          playerA.totalScore
        );
      }

      return (
        playerA.playerIndex -
        playerB.playerIndex
      );
    });

  const rankByPlayerIndex = {};

  sortedPlayers.forEach(
    (player, sortedIndex) => {
      if (sortedIndex === 0) {
        rankByPlayerIndex[
          player.playerIndex
        ] = 1;

        return;
      }

      const previousPlayer =
        sortedPlayers[sortedIndex - 1];

      if (
        player.totalScore ===
        previousPlayer.totalScore
      ) {
        rankByPlayerIndex[
          player.playerIndex
        ] =
          rankByPlayerIndex[
            previousPlayer.playerIndex
          ];

        return;
      }

      rankByPlayerIndex[
        player.playerIndex
      ] = sortedIndex + 1;
    },
  );

  const championScore =
    sortedPlayers[0]?.totalScore ?? 0;

  const championPlayers =
    sortedPlayers.filter(
      (player) =>
        player.totalScore === championScore,
    );

  return (
    <div className="finalResultOverlay">
      <section
        className="finalResultPanel"
        aria-label="最終結果"
      >
        <header className="finalResultHeader">
          <span className="finalResultSubTitle">
            SEVENS FINAL RESULT
          </span>

          <h2>最終結果</h2>

          <p>全7回戦終了</p>
        </header>

        <section className="finalChampionArea">
          <span className="finalChampionLabel">
            CHAMPION
          </span>

          <strong className="finalChampionName">
            {championPlayers
              .map(
                (player) =>
                  player.playerName,
              )
              .join("・")}
          </strong>

          <span className="finalChampionScore">
            {formatScore(championScore)}
            点
          </span>
        </section>

        <section className="finalRanking">
          {sortedPlayers.map((player) => {
            const rank =
              rankByPlayerIndex[
                player.playerIndex
              ];

            return (
              <div
                key={player.playerIndex}
                className={`finalRankingRow finalRank${rank}`}
              >
                <div className="finalRankingPosition">
                  <span>{rank}</span>
                  <small>位</small>
                </div>

                <div className="finalRankingPlayer">
                  <img
                    className="finalRankingPlayerIllustration"
                    src={
                      playerIllustrations[
                        player.playerIndex
                      ]
                    }
                    alt={player.playerName}
                  />

                  <strong>
                    {player.playerName}
                  </strong>
                </div>

                <div
                  className={`finalRankingScore ${
                    player.totalScore > 0
                      ? "positiveScore"
                      : player.totalScore < 0
                        ? "negativeScore"
                        : ""
                  }`}
                >
                  {formatScore(
                    player.totalScore,
                  )}
                  <small>点</small>
                </div>
              </div>
            );
          })}
        </section>

        <section className="finalRoundHistory">
          <h3>対局記録</h3>

          <div className="finalRoundHistoryTable">
            <div className="finalHistoryCorner">
              プレイヤー
            </div>

            {Array.from(
              { length: TOTAL_ROUNDS },
              (_, index) => (
                <div
                  key={index}
                  className="finalHistoryRoundHeader"
                >
                  {index + 1}
                </div>
              ),
            )}

            <div className="finalHistoryTotalHeader">
              合計
            </div>

            {playerNames.map(
              (playerName, playerIndex) => (
                <div
                  key={playerName}
                  className="finalHistoryPlayerRow"
                >
                  <div className="finalHistoryPlayerName">
                    {playerName}
                  </div>

                  {Array.from(
                    {
                      length: TOTAL_ROUNDS,
                    },
                    (_, index) => {
                      const roundNumber =
                        index + 1;

                      const savedRound =
                        allRoundScores.find(
                          (round) =>
                            round.roundNumber ===
                            roundNumber,
                        );

                      const score =
                        savedRound?.players[
                          playerIndex
                        ]?.total;

                      return (
                        <div
                          key={roundNumber}
                          className={`finalHistoryScore ${
                            score > 0
                              ? "positiveScore"
                              : score < 0
                                ? "negativeScore"
                                : ""
                          }`}
                        >
                          {typeof score ===
                          "number"
                            ? formatScore(score)
                            : ""}
                        </div>
                      );
                    },
                  )}

                  <div
                    className={`finalHistoryTotal ${
                      totalScores[
                        playerIndex
                      ] > 0
                        ? "positiveScore"
                        : totalScores[
                              playerIndex
                            ] < 0
                          ? "negativeScore"
                          : ""
                    }`}
                  >
                    {formatScore(
                      totalScores[
                        playerIndex
                      ],
                    )}
                  </div>
                </div>
              ),
            )}
          </div>
        </section>

        <footer className="finalResultFooter">
          <button
            type="button"
            className="finalResultHubButton"
            onClick={onBackToHub}
          >
            HUBへ戻る
          </button>

          <button
            type="button"
            className="finalResultRestartButton"
            onClick={onRestart}
          >
            もう一度遊ぶ
          </button>
        </footer>
      </section>
    </div>
  );
}

export default FinalMatchResult;