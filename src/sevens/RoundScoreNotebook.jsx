import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const playerNames = [
  "黒部ナノカ",
  "桜羽エマ",
  "橘シェリー",
  "遠野ハンナ",
];

const SCORE_STEP_INTERVAL = 500;

function formatScore(score) {
  if (score > 0) {
    return `+${score}`;
  }

  return String(score);
}

function RoundScoreNotebook({
  roundNumber,
  savedRoundScores,
  roundResult,
  onNextRound,
  onFinishMatch,
}) {
  const [visibleStep, setVisibleStep] = useState(-1);

  const completedRef = useRef(false);

  /*
    * 表示する点数の順番
    *
    * 0：残り手札
    * 1：順位点
    * 2：生存ボーナス
  */
  const scoreSteps = useMemo(
    () => [
      {
        key: "handPenalty",
        label: "残り手札",
      },
      {
        key: "topBonus",
        label: "順位点",
      },
      {
        key: "survivalBonus",
        label: "生存ボーナス",
      },
    ],
    [],
  );

  useEffect(() => {
    completedRef.current = false;
    setVisibleStep(-1);

    const timers = [];

    scoreSteps.forEach((_, stepIndex) => {
      const timer = window.setTimeout(() => {
        setVisibleStep(stepIndex);
      }, 700 + stepIndex * SCORE_STEP_INTERVAL);

      timers.push(timer);
    });

    const finishTimer = window.setTimeout(() => {
      completedRef.current = true;
    }, 700 + scoreSteps.length * SCORE_STEP_INTERVAL);

    timers.push(finishTimer);

    return () => {
      timers.forEach((timer) => {
        window.clearTimeout(timer);
      });
    };
  }, [roundNumber, scoreSteps]);

  const displayedCurrentScores = roundResult.players.map(
    (playerResult) => {
      let displayedScore = 0;

      scoreSteps.forEach((step, stepIndex) => {
        if (stepIndex <= visibleStep) {
          displayedScore += playerResult[step.key];
        }
      });

      return displayedScore;
    },
  );

  const previousTotals = [0, 1, 2, 3].map(
    (playerIndex) =>
      savedRoundScores.reduce(
        (total, savedRound) =>
          total +
          (savedRound.players[playerIndex]?.total ?? 0),
        0,
      ),
  );

  const displayedTotals = previousTotals.map(
    (previousTotal, playerIndex) =>
      previousTotal +
      displayedCurrentScores[playerIndex],
  );

  const handleNext = () => {
    if (roundNumber >= 7) {
      onFinishMatch();
      return;
    }

    onNextRound();
  };

  return (
    <div className="roundNotebookOverlay">
      <section
        className="roundNotebook"
        aria-label={`${roundNumber}回戦の得点`}
      >
        <div className="roundNotebookBinding">
          {Array.from({ length: 12 }, (_, index) => (
            <span key={index} />
          ))}
        </div>

        <header className="roundNotebookHeader">
          <div>
            <span className="roundNotebookSubTitle">
              SEVENS SCORE NOTE
            </span>

            <h2>
              {roundNumber}
              回戦
            </h2>
          </div>

          <div className="roundNotebookRule">
            <span>1位 +20</span>
            <span>2位 +10</span>
            <span>3位 +5</span>
            <span>4位 +0</span>
            <span>生存 +10</span>
            <span>手札 -1／枚</span>
          </div>
        </header>

        <div className="roundNotebookTable">
          <div className="roundNotebookCorner">
            プレイヤー
          </div>

          {Array.from({ length: 7 }, (_, index) => {
            const displayedRoundNumber = index + 1;

            return (
              <div
                key={displayedRoundNumber}
                className={`roundNotebookRoundHeader ${
                  displayedRoundNumber === roundNumber
                    ? "currentRoundHeader"
                    : ""
                }`}
              >
                {displayedRoundNumber}
              </div>
            );
          })}

          <div className="roundNotebookTotalHeader">
            合計
          </div>

          {playerNames.map((playerName, playerIndex) => {
            const currentPlayerResult =
              roundResult.players[playerIndex];

            return (
              <div
                className="roundNotebookPlayerRow"
                key={playerName}
              >
                <div className="roundNotebookPlayerName">
                  <span className="roundNotebookPlayerNumber">
                    {playerIndex + 1}
                  </span>

                  <span>{playerName}</span>

                  {roundResult.winnerIndex === playerIndex && (
                    <span className="roundWinnerMark">
                      TOP
                    </span>
                  )}

                  {currentPlayerResult.isBurst && (
                    <span className="roundBurstMark">
                      飛び
                    </span>
                  )}
                </div>

                {Array.from({ length: 7 }, (_, index) => {
                  const displayedRoundNumber = index + 1;

                  const savedRound =
                    savedRoundScores.find(
                      (round) =>
                        round.roundNumber ===
                        displayedRoundNumber,
                    );

                  const isCurrentRound =
                    displayedRoundNumber === roundNumber;

                  let scoreText = "";

                  if (savedRound) {
                    scoreText = formatScore(
                      savedRound.players[playerIndex].total,
                    );
                  } else if (isCurrentRound) {
                    scoreText =
                      visibleStep >= scoreSteps.length - 1
                        ? formatScore(
                            currentPlayerResult.total,
                          )
                        : formatScore(
                            displayedCurrentScores[
                              playerIndex
                            ],
                          );
                  }

                  return (
                    <div
                      key={displayedRoundNumber}
                      className={`roundNotebookScoreCell ${
                        isCurrentRound
                          ? "currentRoundScoreCell"
                          : ""
                      } ${
                        scoreText.startsWith("+")
                          ? "positiveScore"
                          : ""
                      } ${
                        scoreText.startsWith("-")
                          ? "negativeScore"
                          : ""
                      }`}
                    >
                      {scoreText}
                    </div>
                  );
                })}

                <div
                  className={`roundNotebookTotalCell ${
                    displayedTotals[playerIndex] > 0
                      ? "positiveScore"
                      : ""
                  } ${
                    displayedTotals[playerIndex] < 0
                      ? "negativeScore"
                      : ""
                  }`}
                >
                  {formatScore(
                    displayedTotals[playerIndex],
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <section className="roundScoreBreakdown">
          <h3>今回の内訳</h3>

          <div className="roundScoreBreakdownGrid">
            {scoreSteps.map((step, stepIndex) => (
              <div
                key={step.key}
                className={`roundScoreStep ${
                  stepIndex <= visibleStep
                    ? "visibleRoundScoreStep"
                    : ""
                }`}
              >
                <span>{step.label}</span>

                <div className="roundScoreStepValues">
                  {roundResult.players.map(
                    (playerResult, playerIndex) => (
                      <strong
                        key={playerIndex}
                        className={
                          playerResult[step.key] > 0
                            ? "positiveScore"
                            : playerResult[step.key] < 0
                              ? "negativeScore"
                              : ""
                        }
                      >
                        {formatScore(
                          playerResult[step.key],
                        )}
                      </strong>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="roundNotebookFooter">
          <div className="roundNotebookProgress">
            {Array.from({ length: 7 }, (_, index) => (
              <span
                key={index}
                className={
                  index < roundNumber
                    ? "completedRoundDot"
                    : ""
                }
              />
            ))}
          </div>

          <button
            type="button"
            className="roundNotebookNextButton"
            onClick={handleNext}
            disabled={
              visibleStep < scoreSteps.length - 1
            }
          >
            {roundNumber >= 7
              ? "最終結果を見る"
              : `${roundNumber + 1}回戦へ`}
          </button>
        </footer>
      </section>
    </div>
  );
}

export default RoundScoreNotebook;