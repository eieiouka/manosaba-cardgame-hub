import { useEffect, useState } from "react";
import "./App.css";
import backgroundImage from "./assets/background.jpg";
import SevensGame from "./sevens/SevensGame";

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
  const [currentPath, setCurrentPath] = useState(
    window.location.pathname,
  );

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
  };

  if (currentPath === "/sevens") {
    return <SevensGame navigate={navigate} />;
  }

  return (
    <main className="hub">
      <div
        className="background"
        style={{
          backgroundImage: `url(${backgroundImage})`,
        }}
      />

      <div className="overlay" />

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
              onClick={() => navigate(game.path)}
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