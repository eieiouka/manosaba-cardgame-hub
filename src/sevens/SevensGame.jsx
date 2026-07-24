import {
  useRef,
  useState,
} from "react";

import StartScreen from "./StartScreen";
import Sevens from "./Sevens";
import { setupSevensGame } from "./sevensLogic";

import {
  createSevensAudioManager,
  warmUpSevensAudio,
} from "./audioManager";

function SevensGame({ navigate }) {
  const [phase, setPhase] = useState("start");

  const [hands, setHands] = useState([]);
  const [openingSevens, setOpeningSevens] =
    useState([]);

  const [
    firstPlayerIndex,
    setFirstPlayerIndex,
  ] = useState(0);

  const [gameId, setGameId] = useState(0);

  /*
    SevensGameが存在している間、
    同じAudioオブジェクトを保持する。

    StartScreenからSevensへ移動しても、
    Audioは作り直されない。
  */
  const audioManagerRef = useRef(null);

  if (audioManagerRef.current === null) {
    audioManagerRef.current =
      createSevensAudioManager();
  }

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

  const handleStart = async () => {
    /*
      開始ボタンのクリック操作中に
      カード音を無音再生してデコードする。
    */
    await warmUpSevensAudio(
      audioManagerRef.current,
    );

    /*
      ウォームアップ直後のスマホ側処理を
      少しだけ待ってから開幕する。
    */
    await new Promise((resolve) => {
      window.setTimeout(resolve, 300);
    });

    setupNewGame();
    setPhase("playing");
  };

  const handleRestart = () => {
    /*
      音声は作り直さない。
      同じaudioManagerを使い続ける。
    */
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
        navigate={navigate}
        hands={hands}
        openingSevens={
          openingSevens
        }
        firstPlayerIndex={
          firstPlayerIndex
        }
        onRestart={handleRestart}
        audioManager={
          audioManagerRef.current
        }
      />
    );
  }

  return null;
}

export default SevensGame;