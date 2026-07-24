import { useEffect, useState } from "react";
import StartScreen from "./StartScreen";
import Sevens from "./Sevens";
import { setupSevensGame } from "./sevensLogic";

function SevensGame() {
  const [phase, setPhase] = useState("start");

  const [hands, setHands] = useState([]);
  const [openingSevens, setOpeningSevens] = useState([]);
  const [firstPlayerIndex, setFirstPlayerIndex] =
    useState(0);
  const [gameId, setGameId] = useState(0);

  // ===========================
  // トランプ画像の先読み
  // ===========================

  const [cardsLoaded, setCardsLoaded] =
    useState(false);

  const [loadProgress, setLoadProgress] =
    useState(0);

  useEffect(() => {
    const cardRanks = [
      "A",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "T",
      "J",
      "Q",
      "K",
    ];

    const cardSuits = [
      "1",
      "2",
      "3",
      "4",
    ];

    const cardPaths = cardRanks.flatMap((rank) =>
      cardSuits.map(
        (suit) =>
          `/cards/card_${rank}${suit}.png`,
      ),
    );

    let loadedCount = 0;

    cardPaths.forEach((path) => {
      const image = new Image();

      const finishLoading = () => {
        loadedCount += 1;

        setLoadProgress(
          Math.round(
            (loadedCount /
              cardPaths.length) *
              100,
          ),
        );

        if (
          loadedCount === cardPaths.length
        ) {
          setCardsLoaded(true);
        }
      };

      image.onload = finishLoading;
      image.onerror = finishLoading;
      image.src = path;
    });
  }, []);

  const setupNewGame = () => {
    const game = setupSevensGame(4);

    setHands(game.hands);
    setOpeningSevens(game.openingSevens);
    setFirstPlayerIndex(
      game.firstPlayerIndex,
    );

    setGameId(
      (currentGameId) =>
        currentGameId + 1,
    );
  };

  const handleStart = () => {
    if (!cardsLoaded) {
      return;
    }

    setupNewGame();
    setPhase("playing");
  };

  const handleRestart = () => {
    setupNewGame();
  };

  if (phase === "start") {
    return (
      <StartScreen
        onStart={handleStart}
        cardsLoaded={cardsLoaded}
        loadProgress={loadProgress}
      />
    );
  }

  if (phase === "playing") {
    return (
      <Sevens
        key={gameId}
        hands={hands}
        openingSevens={openingSevens}
        firstPlayerIndex={
          firstPlayerIndex
        }
        onRestart={handleRestart}
      />
    );
  }

  return null;
}

export default SevensGame;