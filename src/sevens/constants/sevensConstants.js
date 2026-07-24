export const GAME_WIDTH = 1500;
export const GAME_HEIGHT = 1220;
export const PAGE_PADDING = 16;

export const TOTAL_ROUNDS = 7;

export const ROUND_SCORE_STORAGE_KEY =
  "manosaba-sevens-round-scores";

export const ROUND_NUMBER_STORAGE_KEY =
  "manosaba-sevens-round-number";

export const playerNames = [
  "黒部ナノカ（You）",
  "桜羽エマ",
  "橘シェリー",
  "遠野ハンナ",
];

export const suits = [
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

export const emptyBoard = {
  spades: [],
  hearts: [],
  diamonds: [],
  clubs: [],
};

export const openingSourcePositions = {
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

export const opponents = [
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