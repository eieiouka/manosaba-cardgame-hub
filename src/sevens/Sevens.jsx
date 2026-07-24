import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import SevensBoard from "./components/SevensBoard";
import OpponentArea from "./components/OpponentArea";
import PlayerHand from "./components/PlayerHand";
import TurnControls from "./components/TurnControls";
import FlyingCards from "./components/FlyingCards";
import useOpeningAnimation from "./hooks/useOpeningAnimation";
import useCpuTurn from "./hooks/useCpuTurn";
import useAudio from "./hooks/useAudio";
import FinalMatchResult from "./components/FinalMatchResult";
import RoundScoreNotebook from "./components/RoundScoreNotebook";
import "./Sevens.css";

const GAME_WIDTH = 1500;
const GAME_HEIGHT = 1220;
const PAGE_PADDING = 16;

const TOTAL_ROUNDS = 7;

const playerNames = [
  "黒部ナノカ（You）",
  "桜羽エマ",
  "橘シェリー",
  "遠野ハンナ",
];

const ROUND_SCORE_STORAGE_KEY =
  "manosaba-sevens-round-scores";

const ROUND_NUMBER_STORAGE_KEY =
  "manosaba-sevens-round-number";

const navigationEntry =
  window.performance
    .getEntriesByType("navigation")
    .find(
      (entry) =>
        entry.entryType === "navigation",
    );

if (navigationEntry?.type === "reload") {
  window.sessionStorage.removeItem(
    ROUND_SCORE_STORAGE_KEY,
  );

  window.sessionStorage.removeItem(
    ROUND_NUMBER_STORAGE_KEY,
  );
}

function calculateGameScale() {
  const viewportWidth =
    window.visualViewport?.width ?? window.innerWidth;

  const viewportHeight =
    window.visualViewport?.height ?? window.innerHeight;

  const availableWidth = Math.max(
    viewportWidth - PAGE_PADDING * 2,
    1,
  );

  const availableHeight = Math.max(
    viewportHeight - PAGE_PADDING * 2,
    1,
  );

  return Math.min(
    availableWidth / GAME_WIDTH,
    availableHeight / GAME_HEIGHT,
    1,
  );
}

const suits = [
  {
    id: "spades",
    symbol: "♠",
    fileNumber: 1,
  },
  {
    id: "hearts",
    symbol: "♥",
    fileNumber: 2,
  },
  {
    id: "diamonds",
    symbol: "♦",
    fileNumber: 3,
  },
  {
    id: "clubs",
    symbol: "♣",
    fileNumber: 4,
  },
];

const emptyBoard = {
    spades: [],
    hearts: [],
    diamonds: [],
    clubs: [],
};

const openingSourcePositions = {
  0: {
    left: "50%",
    top: "91%",
  },
  1: {
    left: "17%",
    top: "5%",
  },
  2: {
    left: "50%",
    top: "5%",
  },
  3: {
    left: "83%",
    top: "5%",
  },
};

const opponents = [
  {
    id: "player2",
    name: "桜羽エマ",
    remaining: 11,
    image: "/characters/ema.png",
    position: "opponentLeft",
  },
  {
    id: "player3",
    name: "橘シェリー",
    remaining: 10,
    image: "/characters/sherry.png",
    position: "opponentCenter",
  },
  {
    id: "player4",
    name: "遠野ハンナ",
    remaining: 10,
    image: "/characters/hanna.png",
    position: "opponentRight",
  },
];

function loadSavedRoundScores() {
  try {
    const savedValue = window.sessionStorage.getItem(
      ROUND_SCORE_STORAGE_KEY,
    );

    if (!savedValue) {
      return [];
    }

    const parsedValue = JSON.parse(savedValue);

    return Array.isArray(parsedValue)
      ? parsedValue
      : [];
  } catch {
    return [];
  }
}

function loadCurrentRoundNumber() {
  try {
    const savedValue = window.sessionStorage.getItem(
      ROUND_NUMBER_STORAGE_KEY,
    );

    const parsedValue = Number(savedValue);

    if (
      Number.isInteger(parsedValue) &&
      parsedValue >= 1 &&
      parsedValue <= TOTAL_ROUNDS
    ) {
      return parsedValue;
    }

    return 1;
  } catch {
    return 1;
  }
}

function isPlayable(card, board) {
  const playedCards = board[card.suit] ?? [];
  const playedRankSet = new Set(playedCards);

  // 7がまだ置かれていない列では、7だけを出せる
  if (!playedRankSet.has(7)) {
    return card.rank === 7;
  }

  // バーストで離れた位置に置かれた札は無視し、
  // 7から連続してつながっている範囲だけを調べる
  let connectedLowest = 7;
  let connectedHighest = 7;

  while (playedRankSet.has(connectedLowest - 1)) {
    connectedLowest -= 1;
  }

  while (playedRankSet.has(connectedHighest + 1)) {
    connectedHighest += 1;
  }

  return (
    card.rank === connectedLowest - 1 ||
    card.rank === connectedHighest + 1
  );
}

function getNextPlayerIndex(
  currentPlayerIndex,
  burstPlayers = [],
) {
  for (let offset = 1; offset <= 4; offset += 1) {
    const nextPlayerIndex =
      (currentPlayerIndex + offset) % 4;

    if (!burstPlayers.includes(nextPlayerIndex)) {
      return nextPlayerIndex;
    }
  }

  return currentPlayerIndex;
}

function getElementCenterRelativeTo(element, ancestor) {
  let left = 0;
  let top = 0;
  let currentElement = element;

  while (currentElement && currentElement !== ancestor) {
    left += currentElement.offsetLeft;
    top += currentElement.offsetTop;
    currentElement = currentElement.offsetParent;
  }

  if (currentElement !== ancestor) {
    return null;
  }

  return {
    left: left + element.offsetWidth / 2,
    top: top + element.offsetHeight / 2,
  };
}

function Sevens({
  navigate,
  hands,
  openingSevens,
  firstPlayerIndex,
  onRestart,
}) {
  const playerHand = hands[0] ?? [];
  const initialCpuHands = [
    hands[1] ?? [],
    hands[2] ?? [],
    hands[3] ?? [],
  ];

  const [board, setBoard] = useState(emptyBoard);
  const [hand, setHand] = useState(playerHand);

  const [cpuHands, setCpuHands] = useState(
    initialCpuHands
  );

  const [currentPlayerIndex, setCurrentPlayerIndex] =
    useState(firstPlayerIndex);

  const [selectedCard, setSelectedCard] = useState(null);
  const [passes, setPasses] = useState(3);

  const [cpuPasses, setCpuPasses] = useState([
    3,
    3,
    3,
  ]);

  const [gameScale, setGameScale] = useState(
    calculateGameScale,
  );

  const [openingDone, setOpeningDone] =
    useState(false);

  const [flyingCards, setFlyingCards] =
    useState([]);

  const [burstPlayers, setBurstPlayers] =
  useState([]);

  const [burstCardCounts, setBurstCardCounts] =
    useState({});

  const [winnerIndex, setWinnerIndex] =
    useState(null);

  const [winnerType, setWinnerType] =
  useState(null);

  const [currentRound, setCurrentRound] =
    useState(loadCurrentRoundNumber);

  const [savedRoundScores, setSavedRoundScores] =
    useState(loadSavedRoundScores);

  const [roundResult, setRoundResult] =
    useState(null);

  const [finalResultVisible, setFinalResultVisible] =
    useState(false);

  const roundRecordedRef = useRef(false);

  const [turnSeconds, setTurnSeconds] = useState(3);
  const [passPopupPlayerIndex, setPassPopupPlayerIndex] = useState(null);
  const passDelayTimerRef = useRef(null);
  const playerTurnCountRef = useRef(0);
  const forcePlayerActionRef = useRef(null);

  const {
    playPassVoice,
    playCardPlaySound,
    playBurstVoice,
    playFinishVoice,
    playChampionVoice,
  } = useAudio();

  const tableRef = useRef(null);

  const showPassPopupThenAdvance = (playerIndex) => {
    if (passDelayTimerRef.current !== null) {
      window.clearTimeout(passDelayTimerRef.current);
    }

    setPassPopupPlayerIndex(playerIndex);
    playPassVoice(playerIndex);

    passDelayTimerRef.current = window.setTimeout(() => {
      setPassPopupPlayerIndex(null);

      setCurrentPlayerIndex(
        getNextPlayerIndex(
          playerIndex,
          burstPlayers,
        ),
      );

      passDelayTimerRef.current = null;
    }, 1000);
  };

  useOpeningAnimation({
    openingDone,
    openingSevens,
    firstPlayerIndex,
    tableRef,
    getElementCenterRelative: getElementCenterRelativeTo,
    playCardPlaySound,
    setHand,
    setCpuHands,
    setFlyingCards,
    setBoard,
    setCurrentPlayerIndex,
    setOpeningDone,
  });

  useEffect(() => {
    return () => {
      if (passDelayTimerRef.current !== null) {
        window.clearTimeout(passDelayTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const updateGameScale = () => {
      setGameScale(calculateGameScale());
    };

    updateGameScale();

    window.addEventListener("resize", updateGameScale);
    window.visualViewport?.addEventListener(
      "resize",
      updateGameScale,
    );

    return () => {
      window.removeEventListener("resize", updateGameScale);
      window.visualViewport?.removeEventListener(
        "resize",
        updateGameScale,
      );
    };
  }, []);

  const sortedHand = useMemo(() => {
    const suitOrder = {
      spades: 1,
      hearts: 2,
      diamonds: 3,
      clubs: 4,
    };

    return [...hand].sort((cardA, cardB) => {
      const suitDifference =
        suitOrder[cardA.suit] - suitOrder[cardB.suit];

      if (suitDifference !== 0) {
        return suitDifference;
      }

      return cardA.rank - cardB.rank;
    });
  }, [hand]);

  const animateCardToBoard = ({
    card,
    ownerIndex,
    onLanding,
    }) => {
    const tableElement = tableRef.current;

    const targetElement =
        tableElement?.querySelector(
        `[data-board-suit="${card.suit}"][data-board-rank="${card.rank}"]`,
        );

    if (!tableElement || !targetElement) {
        onLanding();
        return;
    }

    const targetCenter =
        getElementCenterRelativeTo(
        targetElement,
        tableElement,
        );

    if (!targetCenter) {
        onLanding();
        return;
    }

    const flyingCardId =
        `normal-${ownerIndex}-${card.suit}-${card.rank}-${Date.now()}`;

    playCardPlaySound();

    setFlyingCards((currentFlyingCards) => [
        ...currentFlyingCards,
        {
        ...card,
        id: flyingCardId,
        ownerIndex,
        targetLeft: targetCenter.left,
        targetTop: targetCenter.top,
        },
    ]);

    window.setTimeout(() => {
        setFlyingCards((currentFlyingCards) =>
        currentFlyingCards.filter(
            (flyingCard) =>
            flyingCard.id !== flyingCardId,
        ),
        );

        onLanding();
    }, 600);
  };

  const burstPlayer = ({
    playerIndex,
    cards,
    }) => {
    if (cards.length === 0) {
        return;
    }

    playBurstVoice(playerIndex);

    const burstCardCount = cards.length;

    setBurstCardCounts((currentCounts) => ({
      ...currentCounts,
      [playerIndex]: burstCardCount,
    }));

    const tableElement = tableRef.current;
    const burstId =
        `burst-${playerIndex}-${Date.now()}`;

    const nextFlyingCards = cards
        .map((card, index) => {
        const targetElement =
            tableElement?.querySelector(
            `[data-board-suit="${card.suit}"][data-board-rank="${card.rank}"]`,
            );

        if (!tableElement || !targetElement) {
            return null;
        }

        const targetCenter =
            getElementCenterRelativeTo(
            targetElement,
            tableElement,
            );

        if (!targetCenter) {
            return null;
        }

        return {
            ...card,
            id: `${burstId}-${index}`,
            burstId,
            ownerIndex: playerIndex,
            targetLeft: targetCenter.left,
            targetTop: targetCenter.top,
        };
        })
        .filter(Boolean);

    // 飛行開始前に手札をすべて消す
    if (playerIndex === 0) {
        setHand([]);
        setSelectedCard(null);
    } else {
        const cpuIndex = playerIndex - 1;

        setCpuHands((currentCpuHands) =>
        currentCpuHands.map(
            (cpuHand, index) =>
            index === cpuIndex ? [] : cpuHand,
        ),
        );
    }

    const nextBurstPlayers = [
        ...burstPlayers,
        playerIndex,
    ].filter(
        (value, index, array) =>
        array.indexOf(value) === index,
    );

    setBurstPlayers(nextBurstPlayers);

    setFlyingCards((currentFlyingCards) => [
        ...currentFlyingCards,
        ...nextFlyingCards,
    ]);

    window.setTimeout(() => {
        setBoard((currentBoard) => {
        const nextBoard = {
            spades: [...currentBoard.spades],
            hearts: [...currentBoard.hearts],
            diamonds: [...currentBoard.diamonds],
            clubs: [...currentBoard.clubs],
        };

        cards.forEach((card) => {
            if (
            !nextBoard[card.suit].includes(card.rank)
            ) {
            nextBoard[card.suit].push(card.rank);
            }
        });

        Object.keys(nextBoard).forEach((suit) => {
            nextBoard[suit].sort(
            (rankA, rankB) => rankA - rankB,
            );
        });

        return nextBoard;
        });

        setFlyingCards((currentFlyingCards) =>
        currentFlyingCards.filter(
            (flyingCard) =>
            flyingCard.burstId !== burstId,
        ),
        );

        const remainingPlayers = [0, 1, 2, 3].filter(
        (playerIndexValue) =>
            !nextBurstPlayers.includes(
            playerIndexValue,
            ),
        );

        if (remainingPlayers.length === 1) {
          setWinnerType("survived");
          setWinnerIndex(remainingPlayers[0]);
          return;
        }

        setCurrentPlayerIndex(
        getNextPlayerIndex(
            playerIndex,
            nextBurstPlayers,
        ),
        );
    }, 600);
  };

useCpuTurn({
  openingDone,
  currentPlayerIndex,
  board,
  cpuHands,
  cpuPasses,
  winnerIndex,
  flyingCards,
  burstPlayers,
  passPopupPlayerIndex,
  hand,

  isPlayable,
  getNextPlayerIndex,
  burstPlayer,
  animateCardToBoard,
  playFinishVoice,
  showPassPopupThenAdvance,

  setCpuHands,
  setBoard,
  setCpuPasses,
  setWinnerType,
  setWinnerIndex,
  setCurrentPlayerIndex,
});

useEffect(() => {
  if (!openingDone) {
    return;
  }

  if (winnerIndex !== null) {
    return;
  }

  if (flyingCards.length > 0) {
    return;
  }

  // パス表示中は、まだ手番を移動している途中なので
  // バースト判定を行わない
  if (passPopupPlayerIndex !== null) {
    return;
  }

  if (currentPlayerIndex !== 0) {
    return;
  }

  if (burstPlayers.includes(0)) {
    return;
  }

  const hasPlayableCard = hand.some((card) =>
    isPlayable(card, board),
  );

  if (
    passes === 0 &&
    !hasPlayableCard &&
    hand.length > 0
  ) {
    burstPlayer({
      playerIndex: 0,
      cards: hand,
    });
  }
}, [
  openingDone,
  winnerIndex,
  flyingCards,
  passPopupPlayerIndex,
  currentPlayerIndex,
  burstPlayers,
  hand,
  board,
  passes,
]);

  const selectCard = (card) => {
    if (flyingCards.length > 0) {
        return;
    }

    if (burstPlayers.includes(0)) {
        return;
    }

    if (!openingDone) {
        return;
    }

    if (currentPlayerIndex !== 0) {
        return;
    }

    if (!isPlayable(card, board)) {
        return;
    }

    setSelectedCard(card);
  };

  const playCard = (forcedCard = null) => {
    if (flyingCards.length > 0) {
        return;
    }

    if (burstPlayers.includes(0)) {
        return;
    }

    if (!openingDone) {
        return;
    }

    if (winnerIndex !== null) {
        return;
    }

    if (currentPlayerIndex !== 0) {
        return;
    }

    const playedCard = forcedCard ?? selectedCard;

    if (!playedCard) {
        return;
    }

    if (!isPlayable(playedCard, board)) {
        setSelectedCard(null);
        return;
    }

    const nextHand = hand.filter(
        (card) =>
        card.suit !== playedCard.suit ||
        card.rank !== playedCard.rank,
    );

    // 飛行開始前に手札から消す
    setHand(nextHand);
    setSelectedCard(null);
    playerTurnCountRef.current += 1;

    animateCardToBoard({
        card: playedCard,
        ownerIndex: 0,

        onLanding: () => {
        // 到着後に盤面へ置く
        setBoard((currentBoard) => ({
            ...currentBoard,
            [playedCard.suit]: [
            ...currentBoard[playedCard.suit],
            playedCard.rank,
            ],
        }));

        if (nextHand.length === 0) {
          playFinishVoice(0);
          setWinnerType("finished");
          setWinnerIndex(0);
          return;
        }

        setCurrentPlayerIndex(
            getNextPlayerIndex(
                0,
                burstPlayers,
            ),
        );
        },
    });
    };

  const passTurn = () => {
    if (passPopupPlayerIndex !== null) {
      return;
    }

    if (flyingCards.length > 0) {
        return;
    }

    if (burstPlayers.includes(0)) {
        return;
    }

    if (!openingDone) {
        return;
    }

    if (currentPlayerIndex !== 0) {
        return;
    }

    if (passes <= 0) {
      return;
    }

    setPasses((current) => current - 1);
    setSelectedCard(null);
    playerTurnCountRef.current += 1;

    showPassPopupThenAdvance(currentPlayerIndex);
  };

  forcePlayerActionRef.current = () => {
    if (
      passPopupPlayerIndex !== null ||
      flyingCards.length > 0 ||
      burstPlayers.includes(0) ||
      !openingDone ||
      winnerIndex !== null ||
      currentPlayerIndex !== 0
    ) {
      return;
    }

    const suitOrder = {
      spades: 1,
      hearts: 2,
      diamonds: 3,
      clubs: 4,
    };

    const leftmostPlayableCard = [...hand]
      .sort((cardA, cardB) => {
        const suitDifference =
          suitOrder[cardA.suit] - suitOrder[cardB.suit];

        if (suitDifference !== 0) {
          return suitDifference;
        }

        return cardA.rank - cardB.rank;
      })
      .find((card) => isPlayable(card, board));

    if (leftmostPlayableCard) {
      playCard(leftmostPlayableCard);
      return;
    }

    // 出せるカードがない場合だけ、時間切れを強制パスとして処理する。
    if (passes > 0) {
      passTurn();
    }
  };

  useEffect(() => {
    const isPlayerTurn =
      openingDone &&
      winnerIndex === null &&
      currentPlayerIndex === 0 &&
      !burstPlayers.includes(0) &&
      flyingCards.length === 0 &&
      passPopupPlayerIndex === null;

    if (!isPlayerTurn) {
      return undefined;
    }

    // 最初の自分の手だけは時間制限なし。
    if (playerTurnCountRef.current === 0) {
      return undefined;
    }

    const timeLimit = 3;
    const deadline = Date.now() + timeLimit * 1000;
    setTurnSeconds(timeLimit);

    const countdownTimer = window.setInterval(() => {
      const nextSeconds = Math.max(
        0,
        Math.ceil((deadline - Date.now()) / 1000),
      );

      setTurnSeconds(nextSeconds);
    }, 100);

    const forceActionTimer = window.setTimeout(() => {
      setTurnSeconds(0);
      forcePlayerActionRef.current?.();
    }, timeLimit * 1000);

    return () => {
      window.clearInterval(countdownTimer);
      window.clearTimeout(forceActionTimer);
    };
  }, [
    openingDone,
    winnerIndex,
    currentPlayerIndex,
    burstPlayers,
    flyingCards.length,
    passPopupPlayerIndex,
  ]);

  useEffect(() => {
    if (winnerIndex === null) {
      return;
    }

    if (!winnerType) {
      return;
    }

    if (roundRecordedRef.current) {
      return;
    }

    roundRecordedRef.current = true;

    const currentHandCounts = [
      hand.length,
      cpuHands[0]?.length ?? 0,
      cpuHands[1]?.length ?? 0,
      cpuHands[2]?.length ?? 0,
    ];

    const rankPoints = [20, 10, 5, 0];

    const playerResults = [0, 1, 2, 3].map(
      (playerIndex) => {
        const isBurst =
          burstPlayers.includes(playerIndex);

        const remainingHandCount = isBurst
          ? burstCardCounts[playerIndex] ?? 0
          : currentHandCounts[playerIndex];

        return {
          playerIndex,
          isBurst,
          remainingHandCount,
        };
      },
    );

        const sortedPlayerResults = [...playerResults].sort(
          (resultA, resultB) => {
            /*
            * 実際にゲームを終了させたプレイヤーを、
            * 残り手札枚数に関係なく必ず1位にする。
            */
            if (resultA.playerIndex === winnerIndex) {
              return -1;
            }

            if (resultB.playerIndex === winnerIndex) {
              return 1;
            }

            /*
            * トップ以外では、
            * 飛んでいないプレイヤーを飛んだプレイヤーより
            * 上位にする。
            */
            if (resultA.isBurst !== resultB.isBurst) {
              return resultA.isBurst ? 1 : -1;
            }

            /*
            * どちらも飛んでいない場合は、
            * ゲーム終了時の残り手札が少ない方を上位にする。
            */
            if (!resultA.isBurst && !resultB.isBurst) {
              return (
                resultA.remainingHandCount -
                resultB.remainingHandCount
              );
            }

            /*
            * どちらも飛んでいる場合は、
            * 後に飛んだプレイヤーを上位にする。
            *
            * burstPlayersは、
            * [最初に飛んだ人, 次に飛んだ人, ...]
            * の順番で保存されている。
            */
            const burstOrderA = burstPlayers.indexOf(
              resultA.playerIndex,
            );

            const burstOrderB = burstPlayers.indexOf(
              resultB.playerIndex,
            );

            return burstOrderB - burstOrderA;
          },
        );

        const rankByPlayerIndex = {};

        sortedPlayerResults.forEach(
          (result, sortedIndex) => {
            if (sortedIndex === 0) {
              rankByPlayerIndex[result.playerIndex] = 0;
              return;
            }

            const previousResult =
              sortedPlayerResults[sortedIndex - 1];

            /*
            * 同着になるのは、
            * トップ以外の生存者同士で、
            * 残り手札枚数も同じ場合だけ。
            *
            * 飛んだプレイヤーは飛んだ順番が異なるため、
            * 同着にはしない。
            */
            const isSameRank =
              result.playerIndex !== winnerIndex &&
              previousResult.playerIndex !== winnerIndex &&
              !result.isBurst &&
              !previousResult.isBurst &&
              result.remainingHandCount ===
                previousResult.remainingHandCount;

            if (isSameRank) {
              rankByPlayerIndex[result.playerIndex] =
                rankByPlayerIndex[
                  previousResult.playerIndex
                ];
            } else {
              rankByPlayerIndex[result.playerIndex] =
                sortedIndex;
            }
          },
        );

    const players = playerResults.map((result) => {
      const {
        playerIndex,
        isBurst,
        remainingHandCount,
      } = result;

      const handPenalty = -remainingHandCount;

      const rank =
        rankByPlayerIndex[playerIndex];

      const rankBonus =
        rankPoints[rank] ?? 0;

      const survivalBonus =
        isBurst ? 0 : 10;

      return {
        playerIndex,
        remainingHandCount,
        handPenalty,
        topBonus: rankBonus,
        survivalBonus,
        isBurst,
        total:
          handPenalty +
          rankBonus +
          survivalBonus,
      };
    });

    setRoundResult({
      roundNumber: currentRound,
      winnerIndex,
      winnerType,
      isFinishedTop:
        winnerType === "finished",
      players,
    });
  }, [
    winnerIndex,
    winnerType,
    currentRound,
    hand,
    cpuHands,
    burstPlayers,
    burstCardCounts,
  ]);

    const saveCurrentRoundResult = () => {
      if (!roundResult) {
        return savedRoundScores;
      }

      const alreadySaved = savedRoundScores.some(
        (savedRound) =>
          savedRound.roundNumber ===
          roundResult.roundNumber,
      );

      if (alreadySaved) {
        return savedRoundScores;
      }

      const nextSavedRoundScores = [
        ...savedRoundScores,
        roundResult,
      ];

      setSavedRoundScores(nextSavedRoundScores);

      window.sessionStorage.setItem(
        ROUND_SCORE_STORAGE_KEY,
        JSON.stringify(nextSavedRoundScores),
      );

      return nextSavedRoundScores;
    };

    const goToNextRound = () => {
      if (!roundResult) {
        return;
      }

      saveCurrentRoundResult();

      const nextRound = Math.min(
        TOTAL_ROUNDS,
        currentRound + 1,
      );

      window.sessionStorage.setItem(
        ROUND_NUMBER_STORAGE_KEY,
        String(nextRound),
      );

      onRestart();
    };

    const showFinalResult = () => {
      const allRoundScores =
        saveCurrentRoundResult();

      const totalScores = [0, 1, 2, 3].map(
        (playerIndex) =>
          allRoundScores.reduce(
            (total, savedRound) =>
              total +
              (
                savedRound.players[playerIndex]
                  ?.total ?? 0
              ),
            0,
          ),
      );

      const highestScore = Math.max(
        ...totalScores,
      );

      const championPlayerIndex =
        totalScores.findIndex(
          (score) => score === highestScore,
        );

      setFinalResultVisible(true);
      playChampionVoice(championPlayerIndex);
    };

    const restartGame = () => {
      window.sessionStorage.removeItem(
        ROUND_SCORE_STORAGE_KEY,
      );

      window.sessionStorage.removeItem(
        ROUND_NUMBER_STORAGE_KEY,
      );

      setSavedRoundScores([]);
      setCurrentRound(1);
      setRoundResult(null);
      setFinalResultVisible(false);
      setWinnerType(null);
      setWinnerIndex(null);

      roundRecordedRef.current = false;

      onRestart();
    };

  return (
    <main className="sevensPage">
      <div
        className="sevensGameFrame"
        style={{
          width: GAME_WIDTH * gameScale,
          height: GAME_HEIGHT * gameScale,
        }}
      >
        <div
          className="sevensGameCanvas"
          style={{
            transform: `scale(${gameScale})`,
          }}
        >
        <header className="sevensHeader">
          <button
            type="button"
            className="backButton"
            onClick={() => navigate("/")}
          >
            ← HUBへ戻る
          </button>

          <div className="sevensTitle">
            <span>MANOSABA CARD GAMES</span>
            <h1>SEVENS</h1>
            <p>七並べ</p>
          </div>

          <button
            type="button"
            className="restartButton"
            onClick={restartGame}
          >
            やり直す
          </button>
        </header>

        <section
            ref={tableRef}
            className="sevensTable"
        >
          <FlyingCards
            flyingCards={flyingCards}
            openingSourcePositions={openingSourcePositions}
          />

          <OpponentArea
            opponents={opponents}
            openingDone={openingDone}
            currentPlayerIndex={currentPlayerIndex}
            burstPlayers={burstPlayers}
            burstCardCounts={burstCardCounts}
            cpuHands={cpuHands}
            cpuPasses={cpuPasses}
            passPopupPlayerIndex={passPopupPlayerIndex}
          />

          <SevensBoard
            suits={suits}
            board={board}
            isPlayable={isPlayable}
          />

          <section className="playerArea">

            <PlayerHand
              sortedHand={sortedHand}
              openingDone={openingDone}
              currentPlayerIndex={currentPlayerIndex}
              board={board}
              selectedCard={selectedCard}
              burstPlayers={burstPlayers}
              burstCardCounts={burstCardCounts}
              isPlayable={isPlayable}
              onSelectCard={selectCard}
              onPlayCard={playCard}
            />

          <TurnControls
            openingDone={openingDone}
            currentPlayerIndex={currentPlayerIndex}
            flyingCards={flyingCards}
            passPopupPlayerIndex={passPopupPlayerIndex}
            burstPlayers={burstPlayers}
            selectedCard={selectedCard}
            passes={passes}
            turnSeconds={turnSeconds}
            isFirstPlayerTurn={
              playerTurnCountRef.current === 0
            }
            onPlayCard={() => playCard()}
            onPassTurn={passTurn}
          />
            
          </section>
        </section>

        {winnerIndex !== null &&
          roundResult !== null &&
          !finalResultVisible && (
            <RoundScoreNotebook
              roundNumber={currentRound}
              savedRoundScores={savedRoundScores}
              roundResult={roundResult}
              onNextRound={goToNextRound}
              onFinishMatch={showFinalResult}
            />
          )}

          {finalResultVisible && roundResult !== null && (
            <FinalMatchResult
              savedRoundScores={savedRoundScores}
              roundResult={roundResult}
              onRestart={restartGame}
              onBackToHub={() => navigate("/")}
            />
          )}
        </div>
      </div>
    </main>
  );
}

export default Sevens;