import { useEffect, useState } from "react";
import "./StartScreen.css";

const START_WIDTH = 1500;
const START_HEIGHT = 1220;
const PAGE_PADDING = 16;

function StartScreen({ onStart }) {
  const [screenScale, setScreenScale] = useState(1);

  useEffect(() => {
    const updateScreenScale = () => {
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
        availableWidth / START_WIDTH,
        availableHeight / START_HEIGHT,
        1,
      );

      setScreenScale(nextScale);
    };

    updateScreenScale();

    window.addEventListener("resize", updateScreenScale);
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

  return (
    <main className="sevensStartPage">
      <div
        className="sevensStartFrame"
        style={{
          width: START_WIDTH * screenScale,
          height: START_HEIGHT * screenScale,
        }}
      >
        <section
          className="sevensStartCanvas"
          style={{
            transform: `scale(${screenScale})`,
          }}
        >
          <img
            className="sevensStartBackground"
            src="/backgrounds/sevens-start.png"
            alt=""
          />

          <div className="sevensStartShade" />

          <button
            type="button"
            className="sevensStartButton"
            onClick={onStart}
          >
            <span className="sevensStartTitle">
              七並べ
            </span>

            <span className="sevensStartText">
              ゲームスタート
            </span>
          </button>
        </section>
      </div>
    </main>
  );
}

export default StartScreen;