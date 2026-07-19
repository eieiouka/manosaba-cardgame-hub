import { useState } from "react";
import StartScreen from "./StartScreen";
import Sevens from "./Sevens";
import { dealCards } from "./sevensLogic";

function SevensGame() {
  const [phase, setPhase] = useState("start");
  const [hands, setHands] = useState([]);

  const handleStart = () => {
    const dealtHands = dealCards(4);

    setHands(dealtHands);
    setPhase("playing");
  };

  if (phase === "start") {
    return <StartScreen onStart={handleStart} />;
  }

  if (phase === "playing") {
    return <Sevens hands={hands} />;
  }

  return null;
}

export default SevensGame;