import { useState } from "react";
import StartScreen from "./StartScreen";
import Sevens from "./Sevens";
import { setupSevensGame } from "./sevensLogic";

function SevensGame() {
  const [phase, setPhase] = useState("start");

  const [hands, setHands] = useState([]);
  const [openingSevens, setOpeningSevens] = useState([]);
  const [firstPlayerIndex, setFirstPlayerIndex] =
    useState(0);

  const handleStart = () => {
    const game = setupSevensGame(4);

    setHands(game.hands);
    setOpeningSevens(game.openingSevens);
    setFirstPlayerIndex(game.firstPlayerIndex);

    setPhase("playing");
  };

  if (phase === "start") {
    return <StartScreen onStart={handleStart} />;
  }

  if (phase === "playing") {
    return (
      <Sevens
        hands={hands}
        openingSevens={openingSevens}
        firstPlayerIndex={firstPlayerIndex}
      />
    );
  }

  return null;
}

export default SevensGame;