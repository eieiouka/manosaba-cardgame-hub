import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import "./Sevens.css";

const GAME_WIDTH = 1500;
const GAME_HEIGHT = 1220;
const PAGE_PADDING = 16;

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
  const playedCards = board[card.suit];

  if (!playedCards || playedCards.length === 0) {
    return card.rank === 7;
  }

  const lowest = Math.min(...playedCards);
  const highest = Math.max(...playedCards);

  return card.rank === lowest - 1 || card.rank === highest + 1;
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
  const [gameScale, setGameScale] = useState(1);

  const [openingDone, setOpeningDone] =
    useState(false);

  const [flyingCard, setFlyingCard] =
    useState(null);

  const tableRef = useRef(null);

  useEffect(() => {
    const updateGameScale = () => {
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

      const nextScale = Math.min(
        availableWidth / GAME_WIDTH,
        availableHeight / GAME_HEIGHT,
        1,
      );

      setGameScale(nextScale);
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

            setFlyingCard({
              ...card,
              targetLeft: targetCenter.left,
              targetTop: targetCenter.top,
            });
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

        setFlyingCard(null);
        }, index * launchInterval + flightDuration);

        timers.push(launchTimer, landingTimer);
    });

    const finishTimer = window.setTimeout(() => {
        if (cancelled) {
        return;
        }

        setFlyingCard(null);
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

  const selectCard = (card) => {
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
    if (!openingDone) {
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

    setBoard((currentBoard) => ({
      ...currentBoard,
      [selectedCard.suit]: [
        ...currentBoard[selectedCard.suit],
        selectedCard.rank,
      ],
    }));

    setHand((currentHand) =>
      currentHand.filter(
        (card) =>
          card.suit !== selectedCard.suit ||
          card.rank !== selectedCard.rank,
      ),
    );

    setSelectedCard(null);
  };

  const passTurn = () => {
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
  };

    const restartGame = () => {
        setBoard(emptyBoard);
        setHand(playerHand);
        setCpuHands(initialCpuHands);
        setSelectedCard(null);
        setPasses(3);
        setFlyingCard(null);
        setCurrentPlayerIndex(firstPlayerIndex);
        setOpeningDone(false);
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
            {flyingCard && (
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
                    rank={7}
                    small
                    />
                </div>
                )}
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

                        <div className="opponentRemaining">
                        残り{cpuHands[opponentIndex].length}枚
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
        </div>
      </div>
    </main>
  );
}

export default Sevens;