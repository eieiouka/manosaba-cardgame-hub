import "./App.css";

const games = [
  {
    id: "sevens",
    suit: "♠",
    title: "SEVENS",
    japaneseTitle: "七並べ",
    description: "最初のゲーム",
    path: "/sevens",
    available: true,
  },
];

function App() {
  const openGame = (game) => {
    if (!game.available) return;

    // 今後React Routerに変更予定
    window.location.href = game.path;
  };

  return (
    <main className="hub">
      {/* 背景画像（CSSで設定予定） */}
      <div className="background" />

      {/* 暗くするオーバーレイ */}
      <div className="overlay" />

      {/* コンテンツ */}
      <div className="container">
        <header className="header">
          <p className="subTitle">WELCOME</p>

          <h1 className="title">
            MANOSABA
            <br />
            CARD GAMES
          </h1>

          <div className="line" />

          <p className="description">
            まのさばカードゲーム HUB
          </p>
        </header>

        <section className="gameList">
          {games.map((game) => (
            <button
              key={game.id}
              className="gameButton"
              onClick={() => openGame(game)}
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

                  <div className="gameDescription">
                    {game.description}
                  </div>
                </div>
              </div>

              <div className="play">PLAY ▶</div>
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