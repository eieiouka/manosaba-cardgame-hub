import {
  useEffect,
  useState,
} from "react";

import "./RuleScreen.css";

const RULE_WIDTH = 1500;
const RULE_HEIGHT = 1220;
const PAGE_PADDING = 16;

function RuleScreen({ onConfirm }) {
  const [screenScale, setScreenScale] =
    useState(1);

  const [starting, setStarting] =
    useState(false);

  useEffect(() => {
    const updateScreenScale = () => {
      const viewportWidth =
        window.visualViewport?.width ??
        window.innerWidth;

      const viewportHeight =
        window.visualViewport?.height ??
        window.innerHeight;

      const availableWidth = Math.max(
        viewportWidth - PAGE_PADDING * 2,
        1,
      );

      const availableHeight = Math.max(
        viewportHeight - PAGE_PADDING * 2,
        1,
      );

      const nextScale = Math.min(
        availableWidth / RULE_WIDTH,
        availableHeight / RULE_HEIGHT,
        1,
      );

      setScreenScale(nextScale);
    };

    updateScreenScale();

    window.addEventListener(
      "resize",
      updateScreenScale,
    );

    window.visualViewport?.addEventListener(
      "resize",
      updateScreenScale,
    );

    return () => {
      window.removeEventListener(
        "resize",
        updateScreenScale,
      );

      window.visualViewport?.removeEventListener(
        "resize",
        updateScreenScale,
      );
    };
  }, []);

  const handleConfirm = async () => {
    if (starting) {
      return;
    }

    setStarting(true);

    try {
      await onConfirm();
    } catch {
      setStarting(false);
    }
  };

  return (
    <main className="sevensRulePage">
      <div
        className="sevensRuleFrame"
        style={{
          width: RULE_WIDTH * screenScale,
          height: RULE_HEIGHT * screenScale,
        }}
      >
        <section
          className="sevensRuleCanvas"
          style={{
            transform: `scale(${screenScale})`,
          }}
        >
          <div className="sevensRulePanel">
            <header className="sevensRuleHeader">
              <span>SEVENS RULES</span>
              <h1>七並べの遊び方</h1>
              <p>
                すべてのカードを出し切り、
                7回戦の合計得点でトップを目指そう
              </p>
            </header>

            <div className="sevensRuleList">
              <article className="sevensRuleItem">
                <strong>1</strong>

                <div>
                  <h2>7の隣からカードを出す</h2>

                  <p>
                    各マークの7を中心に、
                    6・8、5・9の順番でカードを
                    並べていきます。
                  </p>
                </div>
              </article>

              <article className="sevensRuleItem">
                <strong>2</strong>

                <div>
                  <h2>出せない時はパス</h2>

                  <p>
                    パスは1人3回まで使えます。
                    残り回数は画面のボタンや
                    相手の表示から確認できます。
                  </p>
                </div>
              </article>

              <article className="sevensRuleItem">
                <strong>3</strong>

                <div>
                  <h2>パスを使い切るとバースト</h2>

                  <p>
                    3回パスした後にカードを
                    出せなくなるとバーストし、
                    手札をすべて盤面へ出します。
                  </p>
                </div>
              </article>

              <article className="sevensRuleItem">
                <strong>4</strong>

                <div>
                  <h2>自分のターンは3秒</h2>

                  <p>
                    最初の1手には制限時間がありません。
                    2手目以降は3秒以内に
                    カードを選んでください。
                  </p>
                </div>
              </article>

              <article className="sevensRuleItem">
                <strong>5</strong>

                <div>
                  <h2>全7回戦の合計点で勝負</h2>

                  <p>
                    各回戦の順位や生存状況によって
                    得点が加算されます。
                    7回戦終了時の最高得点者が
                    チャンピオンです。
                  </p>
                </div>
              </article>
            </div>

            <button
              type="button"
              className="sevensRuleConfirmButton"
              onClick={handleConfirm}
              disabled={starting}
            >
              {starting ? "準備中..." : "OK"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default RuleScreen;