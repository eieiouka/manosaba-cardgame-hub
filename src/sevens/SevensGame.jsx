import { useState } from "react";

import Sevens from "./Sevens";
import StartScreen from "./StartScreen";

import "./SevensGame.css";

function SevensGame() {
  const [gamePhase, setGamePhase] = useState("start");

  function handleGameStart() {
    setGamePhase("playing");
  }

  function handleRestart() {
    setGamePhase("start");
  }

  return (
    <main className="sevensGame">
      {gamePhase === "start" && (
        <StartScreen onStart={handleGameStart} />
      )}

      {gamePhase === "playing" && (
        <Sevens onRestart={handleRestart} />
      )}
    </main>
  );
}

export default SevensGame;