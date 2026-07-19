import "./App.css";
import backgroundImage from "./assets/background.jpg";

const games = [
  {
    id: "sevens",
    suit: "♠",
    title: "SEVENS",
    japaneseTitle: "七並べ",
    path: "/sevens",
    available: true,
  },
];

function App() {
  const openGame = (game) => {
    if (!game.available) return;

    window.location.href = game.path;
  };

  return (
    <main className="hub">
      {/* 背景画像 */}
      <div
        className="background"
        style={{
          backgroundImage: `url(${backgroundImage})`,
        }}
      />

      {/* 暗くするオーバーレイ */}
      <div className="overlay" />

      {/* メインコンテンツ */}
      <div className="container">
        <header className="header">
          <p className="subTitle">WELCOME</p>

          <h1 className="title">
            MANOSABA
            <br />
            CARD GAMES
          </h1>

          <div className="line" />

        </header>

        <section className="gameList">
          {games.map((game) => (
            <button
              key={game.id}
              type="button"
              className="gameButton"
              onClick={() => openGame(game)}
              disabled={!game.available}
            >
              <div className="left">
                <span className="suit">{game.suit}</span>

                <div>
                  <div className="english">
                    {game.title}
                  </div>

                  <div className="japanese">
                    {game.japaneseTitle}
                  </div>
                </div>
              </div>

              <div className="play">
                {game.available ? "PLAY ▶" : "COMING SOON"}
              </div>
            </button>
          ))}
        </section>

        <footer className="footer">
          Version 1.0.0
        </footer>
      </div>
    </main>
  );
}

export default App;