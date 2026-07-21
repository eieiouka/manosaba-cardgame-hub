const SUITS = [
  "spades",
  "hearts",
  "diamonds",
  "clubs",
];

const SIDES = [
  "left",
  "right",
];

/**
 * 配列からランダムに1つ選ぶ。
 */
function chooseRandom(items) {
  if (!items || items.length === 0) {
    return null;
  }

  const index = Math.floor(
    Math.random() * items.length,
  );

  return items[index];
}

/**
 * 指定スートについて、
 * 7から連続して盤面に出ている範囲を取得する。
 *
 * バーストで離れた位置にあるカードは、
 * 連続範囲には含めない。
 */
function getConnectedRange(board, suit) {
  const playedCards = board[suit] ?? [];
  const playedRankSet = new Set(playedCards);

  let connectedLowest = 7;
  let connectedHighest = 7;

  while (
    connectedLowest > 1 &&
    playedRankSet.has(connectedLowest - 1)
  ) {
    connectedLowest -= 1;
  }

  while (
    connectedHighest < 13 &&
    playedRankSet.has(connectedHighest + 1)
  ) {
    connectedHighest += 1;
  }

  return {
    connectedLowest,
    connectedHighest,
  };
}

/**
 * 左翼のカードが、
 * 現在の盤面から何番目に出せるかを計算する。
 *
 * すでに盤面にあるバーストカードは数えない。
 */
function getLeftPlayOrder({
  targetRank,
  connectedLowest,
  playedRankSet,
}) {
  let order = 0;

  for (
    let rank = connectedLowest - 1;
    rank >= targetRank;
    rank -= 1
  ) {
    if (!playedRankSet.has(rank)) {
      order += 1;
    }
  }

  return order;
}

/**
 * 右翼のカードが、
 * 現在の盤面から何番目に出せるかを計算する。
 *
 * すでに盤面にあるバーストカードは数えない。
 */
function getRightPlayOrder({
  targetRank,
  connectedHighest,
  playedRankSet,
}) {
  let order = 0;

  for (
    let rank = connectedHighest + 1;
    rank <= targetRank;
    rank += 1
  ) {
    if (!playedRankSet.has(rank)) {
      order += 1;
    }
  }

  return order;
}

/**
 * 現在の盤面について、
 * 各スートの左右にあと何枚出せるかを調べる。
 *
 * バーストですでに盤面にあるカードは、
 * 残り枚数から除外する。
 */
export function analyzeCpuBoard(board) {
  const analysis = {
    spades: {
      leftRemaining: 0,
      rightRemaining: 0,
    },

    hearts: {
      leftRemaining: 0,
      rightRemaining: 0,
    },

    diamonds: {
      leftRemaining: 0,
      rightRemaining: 0,
    },

    clubs: {
      leftRemaining: 0,
      rightRemaining: 0,
    },
  };

  for (const suit of SUITS) {
    const playedCards = board[suit] ?? [];
    const playedRankSet = new Set(playedCards);

    const {
      connectedLowest,
      connectedHighest,
    } = getConnectedRange(board, suit);

    let leftRemaining = 0;
    let rightRemaining = 0;

    for (
      let rank = connectedLowest - 1;
      rank >= 1;
      rank -= 1
    ) {
      if (!playedRankSet.has(rank)) {
        leftRemaining += 1;
      }
    }

    for (
      let rank = connectedHighest + 1;
      rank <= 13;
      rank += 1
    ) {
      if (!playedRankSet.has(rank)) {
        rightRemaining += 1;
      }
    }

    analysis[suit] = {
      leftRemaining,
      rightRemaining,
      connectedLowest,
      connectedHighest,
    };
  }

  return analysis;
}

/**
 * CPUの手札を、
 * 4スート × 左右の8方向に分類する。
 *
 * 各カードには、
 * 現在の盤面から何番目に出せるかを保存する。
 *
 * バースト済みカードは飛ばして数える。
 */
export function analyzeCpuHand(cpuHand, board) {
  const handInfo = {
    spades: {
      left: [],
      right: [],
    },

    hearts: {
      left: [],
      right: [],
    },

    diamonds: {
      left: [],
      right: [],
    },

    clubs: {
      left: [],
      right: [],
    },
  };

  for (const suit of SUITS) {
    const playedCards = board[suit] ?? [];
    const playedRankSet = new Set(playedCards);

    const {
      connectedLowest,
      connectedHighest,
    } = getConnectedRange(board, suit);

    const suitCards = cpuHand.filter(
      (card) => card.suit === suit,
    );

    for (const card of suitCards) {
      /*
       * 左翼
       */
      if (card.rank < connectedLowest) {
        const order = getLeftPlayOrder({
          targetRank: card.rank,
          connectedLowest,
          playedRankSet,
        });

        handInfo[suit].left.push({
          card,
          rank: card.rank,
          order,
        });
      }

      /*
       * 右翼
       */
      if (card.rank > connectedHighest) {
        const order = getRightPlayOrder({
          targetRank: card.rank,
          connectedHighest,
          playedRankSet,
        });

        handInfo[suit].right.push({
          card,
          rank: card.rank,
          order,
        });
      }
    }

    /*
     * 盤面に近いカードから順に並べる。
     */
    handInfo[suit].left.sort(
      (a, b) => a.order - b.order,
    );

    handInfo[suit].right.sort(
      (a, b) => a.order - b.order,
    );
  }

  return handInfo;
}

/**
 * CPUが指定カードを現在出せるか判定する。
 *
 * バースト札は盤面の端として扱わず、
 * 7から連続している端だけを見る。
 */
export function isCpuCardPlayable(card, board) {
  const {
    connectedLowest,
    connectedHighest,
  } = getConnectedRange(board, card.suit);

  return (
    card.rank === connectedLowest - 1 ||
    card.rank === connectedHighest + 1
  );
}

/**
 * CPUの手札から、
 * 現在出せるカードだけを取得する。
 */
export function getCpuPlayableCards(
  cpuHand,
  board,
) {
  return cpuHand.filter((card) =>
    isCpuCardPlayable(card, board),
  );
}

/**
 * 8方向を平らな配列へ変換する。
 */
function getDirections(
  handInfo,
  boardAnalysis,
) {
  const directions = [];

  for (const suit of SUITS) {
    for (const side of SIDES) {
      const cards = handInfo[suit][side];

      const remaining =
        side === "left"
          ? boardAnalysis[suit].leftRemaining
          : boardAnalysis[suit].rightRemaining;

      directions.push({
        suit,
        side,
        cards,
        remaining,
      });
    }
  }

  return directions;
}

/**
 * 指定された順番のカードを
 * その方向で持っているか調べる。
 */
function hasOrder(direction, order) {
  return direction.cards.some(
    (entry) => entry.order === order,
  );
}

/**
 * 指定された順番のカード情報を取得する。
 */
function getCardByOrder(direction, order) {
  return (
    direction.cards.find(
      (entry) => entry.order === order,
    ) ?? null
  );
}

/**
 * 1番目と指定順番のカードを
 * 両方持っている方向を取得する。
 *
 * 例:
 * targetOrder = 2
 * → 1番目と2番目を持つ階段
 *
 * targetOrder = 3
 * → 1番目と3番目を持つ一間飛び
 */
function findLinkedCandidates(
  directions,
  targetOrder,
) {
  return directions
    .filter(
      (direction) =>
        hasOrder(direction, 1) &&
        hasOrder(direction, targetOrder),
    )
    .map((direction) => {
      const firstCard = getCardByOrder(
        direction,
        1,
      );

      return {
        type: "play",
        card: firstCard.card,
        suit: direction.suit,
        side: direction.side,
        handCount: direction.cards.length,
        remaining: direction.remaining,
        };
    });
}

/**
 * 端〇カードの候補を取得する。
 *
 * 条件:
 * ・その方向の残り枚数が指定数
 * ・CPUがその方向で持っている札は1枚だけ
 * ・その1枚が現在出せる1番目のカード
 */
function findEdgeCandidates(
  directions,
  remainingCount,
) {
  return directions
    .filter((direction) => {
      if (
        direction.remaining !== remainingCount
      ) {
        return false;
      }

      if (direction.cards.length !== 1) {
        return false;
      }

      return direction.cards[0].order === 1;
    })
    .map((direction) => ({
        type: "play",
        card: direction.cards[0].card,
        suit: direction.suit,
        side: direction.side,
        handCount: direction.cards.length,
        remaining: direction.remaining,
    }));
}

/**
 * 候補からランダムにカードを選び、
 * CPUの行動形式で返す。
 */
function createRandomPlayAction(
  candidates,
  reason,
) {
  if (!candidates || candidates.length === 0) {
    return null;
  }

  // 自分が多く持っている方向を優先
  const maxHandCount = Math.max(
    ...candidates.map(
      (candidate) => candidate.handCount,
    ),
  );

  const handPriority = candidates.filter(
    (candidate) =>
      candidate.handCount === maxHandCount,
  );

  // 残り枚数が少ない方向を優先
  const minRemaining = Math.min(
    ...handPriority.map(
      (candidate) => candidate.remaining,
    ),
  );

  const finalCandidates = handPriority.filter(
    (candidate) =>
      candidate.remaining === minRemaining,
  );

  console.table(
    finalCandidates.map((candidate) => ({
      suit: candidate.suit,
      side: candidate.side,
      handCount: candidate.handCount,
      remaining: candidate.remaining,
      card: `${candidate.card.suit}-${candidate.card.rank}`,
    })),
  );

  const selected =
    chooseRandom(finalCandidates);

  return {
    type: "play",
    card: selected.card,
    reason,
  };
}

/**
 * コンソール確認用。
 */
function logCpuHandAnalysis(handInfo) {
  const rows = [];

  for (const suit of SUITS) {
    rows.push({
      position: `${suit} left`,
      cards: handInfo[suit].left
        .map(
          ({ rank, order }) =>
            `${rank}(${order}番目)`,
        )
        .join(", "),
      count: handInfo[suit].left.length,
    });

    rows.push({
      position: `${suit} right`,
      cards: handInfo[suit].right
        .map(
          ({ rank, order }) =>
            `${rank}(${order}番目)`,
        )
        .join(", "),
      count: handInfo[suit].right.length,
    });
  }

  console.table(rows);
}

/**
 * CPUの行動を決定する。
 *
 * 優先順位:
 *
 * 1. 階段
 *    1番目と2番目を持っている
 *
 * 2. 端カード
 *    残り1枚で、その方向の手札が1枚だけ
 *
 * 3. 一間飛び
 *    1番目と3番目を持っている
 *
 * 4. パス
 *
 * 5. 端2カード
 *    残り2枚で、その方向の手札が1枚だけ
 *
 * 6. 二間飛び
 *    1番目と4番目を持っている
 *
 * 7. 端3カード
 *
 * 8. 三間飛び
 *    1番目と5番目を持っている
 *
 * 9. 端4カード
 *
 * 10. 四間飛び
 *     1番目と6番目を持っている
 *
 * 11. 端5カード
 *
 * 12. 端6カード
 *
 * 同じ優先順位の候補が複数あれば、
 * ランダムで1つ選ぶ。
 */
export function chooseCpuAction({
  cpuHand,
  board,
  remainingPasses,
  otherPlayerHandCounts,
}) {
  const boardAnalysis =
    analyzeCpuBoard(board);

  const handInfo = analyzeCpuHand(
    cpuHand,
    board,
  );

  const directions = getDirections(
    handInfo,
    boardAnalysis,
  );

    const playableCards =
    getCpuPlayableCards(cpuHand, board);

    const hasFewestHand =
    otherPlayerHandCounts.every(
        (count) => cpuHand.length <= count,
    );

    const movePassToLast =
    hasFewestHand &&
    playableCards.length === cpuHand.length;

    const isHeadsUp =
    otherPlayerHandCounts.length === 1;

  console.log(
    "CPU盤面観測",
    boardAnalysis,
  );

  console.log(
    "CPU手札観測",
    handInfo,
  );

  logCpuHandAnalysis(handInfo);

  /*
   * 1. 階段
   * 1番目と2番目を持っている。
   */
  const staircaseAction =
    createRandomPlayAction(
      findLinkedCandidates(
        directions,
        2,
      ),
      "階段",
    );

  if (staircaseAction) {
    console.log(
      "CPU判断",
      staircaseAction.reason,
      staircaseAction.card,
    );

    return staircaseAction;
  }

  /*
   * 2. 端カード
   * 残り1枚で、その方向の手札が1枚だけ。
   */
  const edgeOneAction =
    createRandomPlayAction(
      findEdgeCandidates(
        directions,
        1,
      ),
      "端カード",
    );

  if (edgeOneAction) {
    console.log(
      "CPU判断",
      edgeOneAction.reason,
      edgeOneAction.card,
    );

    return edgeOneAction;
  }

  if (
    isHeadsUp &&
    !movePassToLast &&
    remainingPasses > 0
    ) {
    return {
        type: "pass",
        reason: "パス",
    };
  }

  /*
   * 3. 一間飛び
   * 1番目と3番目を持っている。
   */
  const oneGapAction =
    createRandomPlayAction(
      findLinkedCandidates(
        directions,
        3,
      ),
      "一間飛び",
    );

  if (oneGapAction) {
    console.log(
      "CPU判断",
      oneGapAction.reason,
      oneGapAction.card,
    );

    return oneGapAction;
  }

  /*
   * 4. パス
   *
   * 上位3条件に該当せず、
   * パスが残っていればパスする。
   */
  if (
    !isHeadsUp &&
    !movePassToLast &&
    remainingPasses > 0
    ) {
    console.log(
      "CPU判断",
      "パス",
    );

    return {
      type: "pass",
      reason: "パス",
    };
  }

  /*
   * 5. 端2カード
   */
  const edgeTwoAction =
    createRandomPlayAction(
      findEdgeCandidates(
        directions,
        2,
      ),
      "端2カード",
    );

  if (edgeTwoAction) {
    console.log(
      "CPU判断",
      edgeTwoAction.reason,
      edgeTwoAction.card,
    );

    return edgeTwoAction;
  }

  /*
   * 6. 二間飛び
   * 1番目と4番目を持っている。
   */
  const twoGapAction =
    createRandomPlayAction(
      findLinkedCandidates(
        directions,
        4,
      ),
      "二間飛び",
    );

  if (twoGapAction) {
    console.log(
      "CPU判断",
      twoGapAction.reason,
      twoGapAction.card,
    );

    return twoGapAction;
  }

  /*
   * 7. 端3カード
   */
  const edgeThreeAction =
    createRandomPlayAction(
      findEdgeCandidates(
        directions,
        3,
      ),
      "端3カード",
    );

  if (edgeThreeAction) {
    console.log(
      "CPU判断",
      edgeThreeAction.reason,
      edgeThreeAction.card,
    );

    return edgeThreeAction;
  }

  /*
   * 8. 三間飛び
   * 1番目と5番目を持っている。
   */
  const threeGapAction =
    createRandomPlayAction(
      findLinkedCandidates(
        directions,
        5,
      ),
      "三間飛び",
    );

  if (threeGapAction) {
    console.log(
      "CPU判断",
      threeGapAction.reason,
      threeGapAction.card,
    );

    return threeGapAction;
  }

  /*
   * 9. 端4カード
   */
  const edgeFourAction =
    createRandomPlayAction(
      findEdgeCandidates(
        directions,
        4,
      ),
      "端4カード",
    );

  if (edgeFourAction) {
    console.log(
      "CPU判断",
      edgeFourAction.reason,
      edgeFourAction.card,
    );

    return edgeFourAction;
  }

  /*
   * 10. 四間飛び
   * 1番目と6番目を持っている。
   */
  const fourGapAction =
    createRandomPlayAction(
      findLinkedCandidates(
        directions,
        6,
      ),
      "四間飛び",
    );

  if (fourGapAction) {
    console.log(
      "CPU判断",
      fourGapAction.reason,
      fourGapAction.card,
    );

    return fourGapAction;
  }

  /*
   * 11. 端5カード
   */
  const edgeFiveAction =
    createRandomPlayAction(
      findEdgeCandidates(
        directions,
        5,
      ),
      "端5カード",
    );

  if (edgeFiveAction) {
    console.log(
      "CPU判断",
      edgeFiveAction.reason,
      edgeFiveAction.card,
    );

    return edgeFiveAction;
  }

  /*
   * 12. 端6カード
   */
  const edgeSixAction =
    createRandomPlayAction(
      findEdgeCandidates(
        directions,
        6,
      ),
      "端6カード",
    );

  if (edgeSixAction) {
    console.log(
      "CPU判断",
      edgeSixAction.reason,
      edgeSixAction.card,
    );

    return edgeSixAction;
  }

  /*
   * 念のための最終処理。
   *
   * パスを使い切っていて、
   * 上記のどの条件にも一致しなかった場合は、
   * 現在出せるカードからランダムに出す。
   */

  if (playableCards.length > 0) {
    const fallbackCard =
      chooseRandom(playableCards);

    console.log(
      "CPU判断",
      "最終ランダム",
      fallbackCard,
    );

    return {
      type: "play",
      card: fallbackCard,
      reason: "最終ランダム",
    };
  }

  return {
    type: "none",
    reason: "行動不能",
  };
}