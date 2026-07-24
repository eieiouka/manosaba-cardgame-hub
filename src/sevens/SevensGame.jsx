import { useState } from "react";
import StartScreen from "./StartScreen";
import Sevens from "./Sevens";
import { setupSevensGame } from "./sevensLogic";

function SevensGame() {
  const [phase, setPhase] = useState("start");

  const [hands, setHands] = useState([]);
  const [openingSevens, setOpeningSevens] =
    useState([]);
  const [
    firstPlayerIndex,
    setFirstPlayerIndex,
  ] = useState(0);
  const [gameId, setGameId] = useState(0);

  const setupNewGame = () => {
    const game = setupSevensGame(4);

    setHands(game.hands);
    setOpeningSevens(
      game.openingSevens,
    );
    setFirstPlayerIndex(
      game.firstPlayerIndex,
    );

    setGameId(
      (currentGameId) =>
        currentGameId + 1,
    );
  };

  const handleStart = () => {
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
      />
    );
  }

  if (phase === "playing") {
    return (
      <Sevens
        key={gameId}
        hands={hands}
        openingSevens={
          openingSevens
        }
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