export default function calculateRoundResult({
  currentRound,
  winnerIndex,
  winnerType,
  hand,
  cpuHands,
  burstPlayers,
  burstCardCounts,
}) {
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
       * burstPlayers は
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

  return {
    roundNumber: currentRound,
    winnerIndex,
    winnerType,
    isFinishedTop:
      winnerType === "finished",
    players,
  };
}