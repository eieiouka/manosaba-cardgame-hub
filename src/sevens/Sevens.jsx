import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { chooseCpuAction } from "./sevensCpu";
import ResultScreen from "./ResultScreen";
import "./Sevens.css";

const GAME_WIDTH = 1500;
const GAME_HEIGHT = 1220;
const PAGE_PADDING = 16;

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

const openingTargetPositions = {
  spades: {
    left: "52%",
    top: "25%",
  },
  hearts: {
    left: "52%",
    top: "39%",
  },
  diamonds: {
    left: "52%",
    top: "53%",
  },
  clubs: {
    left: "52%",
    top: "67%",
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

function getRankFileName(rank) {
  if (rank === 1) return "A";
  if (rank === 10) return "T";
  if (rank === 11) return "J";
  if (rank === 12) return "Q";
  if (rank === 13) return "K";

  return String(rank);
}

function getCardImagePath(suitId, rank) {
  const suit = suits.find((item) => item.id === suitId);

  if (!suit) {
    return "";
  }

  return `/cards/card_${getRankFileName(rank)}${suit.fileNumber}.png`;
}

function getRankLabel(rank) {
  if (rank === 1) return "A";
  if (rank === 11) return "J";
  if (rank === 12) return "Q";
  if (rank === 13) return "K";

  return String(rank);
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

function PlayingCard({
  suit,
  rank,
  onClick,
  selected = false,
  playable = false,
  small = false,
  style,
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const suitData = suits.find((item) => item.id === suit);

  const className = [
    "sevensCard",
    selected ? "selectedCard" : "",
    playable ? "playableCard" : "",
    small ? "smallCard" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={className}
      style={style}
      onClick={onClick}
      disabled={!onClick}
      aria-label={`${suitData?.symbol ?? ""}${getRankLabel(rank)}`}
    >
      {!imageFailed ? (
        <img
          src={getCardImagePath(suit, rank)}
          alt={`${suitData?.symbol ?? ""}${getRankLabel(rank)}`}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div
          className={`fallbackCard ${
            suitData?.id === "hearts" || suitData?.id === "diamonds"
              ? "fallbackRed"
              : "fallbackBlack"
          }`}
        >
          <div className="fallbackCorner">
            <span>{getRankLabel(rank)}</span>
            <strong>{suitData?.symbol}</strong>
          </div>

          <div className="fallbackCenter">{suitData?.symbol}</div>

          <div className="fallbackCorner fallbackBottom">
            <span>{getRankLabel(rank)}</span>
            <strong>{suitData?.symbol}</strong>
          </div>
        </div>
      )}
    </button>
  );
}

function EmptyCardSlot({
  suit,
  rank,
  playable = false,
}) {
  return (
    <div
      className={`emptyCardSlot ${
        playable ? "playableEmptySlot" : ""
      }`}
      data-board-suit={suit}
      data-board-rank={rank}
    >
      {getRankLabel(rank)}
    </div>
  );
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

  const [winnerIndex, setWinnerIndex] =
    useState(null);

  const tableRef = useRef(null);

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

  useEffect(() => {
    if (openingDone) {
        return undefined;
    }

    if (!openingSevens || openingSevens.length === 0) {
        setCurrentPlayerIndex(firstPlayerIndex);
        setOpeningDone(true);
        return undefined;
    }

    let cancelled = false;
    const timers = [];

    const suitOrder = {
        spades: 0,
        hearts: 1,
        diamonds: 2,
        clubs: 3,
    };

    const orderedSevens = [...openingSevens].sort(
        (cardA, cardB) =>
        suitOrder[cardA.suit] -
        suitOrder[cardB.suit],
    );

    const launchInterval = 600;
    const flightDuration = 600;

    orderedSevens.forEach((card, index) => {
        const launchTimer = window.setTimeout(() => {
            if (cancelled) {
                return;
            }

            const tableElement = tableRef.current;

            const targetElement =
                tableElement?.querySelector(
                `[data-board-suit="${card.suit}"][data-board-rank="7"]`,
                );

            if (!tableElement || !targetElement) {
                return;
            }

            const targetCenter =
                getElementCenterRelativeTo(
                  targetElement,
                  tableElement,
                );

            if (!targetCenter) {
              return;
            }

            // 自分が持っていた7なら、飛行エフェクト開始前に手札から消す
            // 7を出した人の手札から、飛行開始前にカードを消す
            if (card.ownerIndex === 0) {
            setHand((currentHand) =>
                currentHand.filter(
                (handCard) =>
                    handCard.suit !== card.suit ||
                    handCard.rank !== 7
                )
            );
            } else {
            const cpuIndex = card.ownerIndex - 1;

            setCpuHands((currentCpuHands) =>
                currentCpuHands.map((cpuHand, index) => {
                if (index !== cpuIndex) {
                    return cpuHand;
                }

                return cpuHand.filter(
                    (handCard) =>
                    handCard.suit !== card.suit ||
                    handCard.rank !== 7
                );
                })
            );
            }

            const flyingCardId =
              `opening-${card.ownerIndex}-${card.suit}-7-${index}`;

            setFlyingCards((currentFlyingCards) => [
              ...currentFlyingCards,
              {
                ...card,
                id: flyingCardId,
                targetLeft: targetCenter.left,
                targetTop: targetCenter.top,
              },
            ]);
        }, index * launchInterval);

        const landingTimer = window.setTimeout(() => {
        if (cancelled) {
            return;
        }

        setBoard((currentBoard) => {
        if (currentBoard[card.suit]?.includes(7)) {
            return currentBoard;
        }

        return {
            ...currentBoard,
            [card.suit]: [
            ...currentBoard[card.suit],
            7,
            ],
        };
        });

        const flyingCardId =
          `opening-${card.ownerIndex}-${card.suit}-7-${index}`;

        setFlyingCards((currentFlyingCards) =>
          currentFlyingCards.filter(
            (flyingCard) => flyingCard.id !== flyingCardId,
          ),
        );
        }, index * launchInterval + flightDuration);

        timers.push(launchTimer, landingTimer);
    });

    const finishTimer = window.setTimeout(() => {
        if (cancelled) {
        return;
        }

        setFlyingCards([]);
        setCurrentPlayerIndex(firstPlayerIndex);
        setOpeningDone(true);
    }, orderedSevens.length * launchInterval + 100);

    timers.push(finishTimer);

    return () => {
        cancelled = true;

        timers.forEach((timer) => {
        window.clearTimeout(timer);
        });
    };
    }, [
    openingDone,
    openingSevens,
    firstPlayerIndex,
    ]);

    useEffect(() => {
        if (!openingDone) {
            return undefined;
        }

        if (winnerIndex !== null) {
            return undefined;
        }

        if (flyingCards.length > 0) {
            return undefined;
        }

        if (burstPlayers.includes(currentPlayerIndex)) {
            setCurrentPlayerIndex(
                getNextPlayerIndex(
                currentPlayerIndex,
                burstPlayers,
                ),
            );

            return undefined;
        }

        if (currentPlayerIndex === 0) {
            return undefined;
        }

        const cpuIndex = currentPlayerIndex - 1;

        const cpuTimer = window.setTimeout(() => {
            const cpuHand = cpuHands[cpuIndex];
            const remainingPasses = cpuPasses[cpuIndex];

            const hasPlayableCard = cpuHand.some((card) =>
            isPlayable(card, board),
            );

            if (
            remainingPasses === 0 &&
            !hasPlayableCard &&
            cpuHand.length > 0
            ) {
            burstPlayer({
                playerIndex: currentPlayerIndex,
                cards: cpuHand,
            });

            return;
            }

            const action = chooseCpuAction({
                cpuHand,
                board,
                remainingPasses,
            });

            // CPU側の判定が古くても、実際に出す直前に
            // 7から連続してつながっているカードかを必ず再確認する
            const playableCpuCards = cpuHand.filter((card) =>
                isPlayable(card, board),
            );

            let validatedAction;

            if (
                action.type === "play" &&
                action.card &&
                isPlayable(action.card, board)
            ) {
                validatedAction = action;
            }
            else if (
                action.type === "pass" &&
                remainingPasses > 0
            ) {
                // AIが戦略的にパスを選択した
                validatedAction = action;
            }
            else if (playableCpuCards.length > 0) {
                // 不正なカードだけ補正する
                validatedAction = {
                    type: "play",
                    card: playableCpuCards[0],
                };
            }
            else if (remainingPasses > 0) {
                validatedAction = {
                    type: "pass",
                };
            }
            else {
                validatedAction = {
                    type: "none",
                };
            }

            if (validatedAction.type === "play") {
                const playedCard = validatedAction.card;

                const nextCpuHand = cpuHand.filter(
                    (card) =>
                    card.suit !== playedCard.suit ||
                    card.rank !== playedCard.rank,
                );

                // 飛行開始前にCPUの手札から消す
                setCpuHands((currentCpuHands) =>
                    currentCpuHands.map(
                    (currentCpuHand, index) =>
                        index === cpuIndex
                        ? nextCpuHand
                        : currentCpuHand,
                    ),
                );

                animateCardToBoard({
                    card: playedCard,
                    ownerIndex: currentPlayerIndex,

                    onLanding: () => {
                    // 到着後に盤面へ置く
                    setBoard((currentBoard) => ({
                        ...currentBoard,
                        [playedCard.suit]: [
                        ...currentBoard[playedCard.suit],
                        playedCard.rank,
                        ],
                    }));

                    if (nextCpuHand.length === 0) {
                        setWinnerIndex(currentPlayerIndex);
                        return;
                    }

                    setCurrentPlayerIndex(
                        getNextPlayerIndex(
                            currentPlayerIndex,
                            burstPlayers,
                        ),
                    );
                    },
                });

                return;
            }

            if (validatedAction.type === "pass") {
            setCpuPasses((currentCpuPasses) =>
                currentCpuPasses.map(
                (remaining, index) =>
                    index === cpuIndex
                    ? Math.max(0, remaining - 1)
                    : remaining,
                ),
            );
            }

            setCurrentPlayerIndex(
                getNextPlayerIndex(
                    currentPlayerIndex,
                    burstPlayers,
                ),
            );
        }, 10);

        return () => {
            window.clearTimeout(cpuTimer);
        };
        }, [
        openingDone,
        currentPlayerIndex,
        board,
        cpuHands,
        cpuPasses,
        winnerIndex,
        flyingCards,
        burstPlayers,
    ]);

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

  const playCard = () => {
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

    if (!selectedCard) {
        return;
    }

    if (!isPlayable(selectedCard, board)) {
        setSelectedCard(null);
        return;
    }

    const playedCard = selectedCard;

    const nextHand = hand.filter(
        (card) =>
        card.suit !== playedCard.suit ||
        card.rank !== playedCard.rank,
    );

    // 飛行開始前に手札から消す
    setHand(nextHand);
    setSelectedCard(null);

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

    setCurrentPlayerIndex(
        getNextPlayerIndex(
            currentPlayerIndex,
            burstPlayers,
        ),
    );
  };

    const restartGame = () => {
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
            {flyingCards.map((flyingCard) => (
                <div
                    key={flyingCard.id}
                    className="openingFlyingCard"
                    style={{
                    "--opening-start-left":
                        openingSourcePositions[
                        flyingCard.ownerIndex
                        ]?.left ?? "50%",

                    "--opening-start-top":
                        openingSourcePositions[
                        flyingCard.ownerIndex
                        ]?.top ?? "50%",

                    "--opening-end-left":
                        `${flyingCard.targetLeft}px`,

                    "--opening-end-top":
                        `${flyingCard.targetTop}px`,
                    }}
                >
                    <PlayingCard
                    suit={flyingCard.suit}
                    rank={flyingCard.rank}
                    small
                    />
                </div>
            ))}
            <section className="opponentsTopRow" aria-label="対戦相手">
                {opponents.map((opponent, opponentIndex) => {
                    const playerIndex = opponentIndex + 1;

                    const isCurrentOpponent =
                    openingDone &&
                    currentPlayerIndex === playerIndex;

                    return (
                    <section
                        className={`opponent ${opponent.position} ${
                        isCurrentOpponent ? "currentOpponent" : ""
                        }`}
                        key={opponent.id}
                    >
                        <img
                        className="opponentIcon"
                        src={opponent.image}
                        alt={opponent.name}
                        />

                        <div className="opponentInfoRow">
                            <span className="opponentRemaining">
                                残り{cpuHands[opponentIndex].length}枚
                            </span>

                            <div
                                className="opponentPasses"
                                aria-label={`残りパス${cpuPasses[opponentIndex]}回`}
                            >
                                {Array.from({ length: 3 }, (_, passIndex) => (
                                <span
                                    key={passIndex}
                                    className={`opponentPassIcon ${
                                    passIndex < cpuPasses[opponentIndex]
                                        ? "passAvailable"
                                        : "passUsed"
                                    }`}
                                >
                                    ●
                                </span>
                                ))}
                            </div>
                        </div>
                    </section>
                    );
                })}
            </section>

          <section className="board">
            {suits.map((suit) => (
              <div className="boardRow" key={suit.id}>
                <div
                  className={`boardSuit ${
                    suit.id === "hearts" || suit.id === "diamonds"
                      ? "redSuit"
                      : "blackSuit"
                  }`}
                >
                  {suit.symbol}
                </div>

                <div className="boardCards">
                  {Array.from({ length: 13 }, (_, index) => {
                    const rank = index + 1;
                    const played = board[suit.id].includes(rank);

                    if (played) {
                      return (
                        <PlayingCard
                          key={`${suit.id}-${rank}`}
                          suit={suit.id}
                          rank={rank}
                          small
                        />
                      );
                    }

                    const playableSlot = isPlayable(
                      {
                        suit: suit.id,
                        rank,
                      },
                      board,
                    );

                    return (
                      <EmptyCardSlot
                        key={`${suit.id}-${rank}`}
                        suit={suit.id}
                        rank={rank}
                        playable={playableSlot}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </section>

          <section className="playerArea">
            <div
              className="playerHand"
              data-count={sortedHand.length}
            >
              <div className="playerHandTrack">
                {sortedHand.map((card, index) => {
                  const playable =
                    openingDone &&
                    currentPlayerIndex === 0 &&
                    isPlayable(card, board);

                  const selected =
                    selectedCard?.suit === card.suit &&
                    selectedCard?.rank === card.rank;

                  return (
                    <PlayingCard
                      key={`${card.suit}-${card.rank}`}
                      suit={card.suit}
                      rank={card.rank}
                      playable={playable}
                      selected={selected}
                      style={{
                        "--hand-index": index,
                        zIndex: index + 1,
                      }}
                      onClick={
                        playable
                            ? () => {
                                if (selected) {
                                playCard();
                                } else {
                                selectCard(card);
                                }
                            }
                            : undefined
                        }
                    />
                  );
                })}
              </div>
            </div>

            <div
                className={`actionButtons ${
                    openingDone && currentPlayerIndex === 0
                    ? "playerTurn"
                    : ""
                }`}
            >
              <button
                type="button"
                className="playCardButton"
                onClick={playCard}
                disabled={
                flyingCards.length > 0 ||
                burstPlayers.includes(0) ||
                !openingDone ||
                currentPlayerIndex !== 0 ||
                !selectedCard
                }
              >
                カードを出す
              </button>

              <button
                type="button"
                className="passButton"
                onClick={passTurn}
                disabled={
                flyingCards.length > 0 ||
                burstPlayers.includes(0) ||
                !openingDone ||
                currentPlayerIndex !== 0 ||
                passes <= 0
                }
              >
                パス 残り{passes}回
              </button>
            </div>
          </section>
        </section>

        {winnerIndex !== null && (
          <ResultScreen
            winnerIndex={winnerIndex}
            onRestart={restartGame}
          />
        )}
        </div>
      </div>
    </main>
  );
}

export default Sevens;