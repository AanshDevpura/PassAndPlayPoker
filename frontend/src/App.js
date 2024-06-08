import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import Start from "./components/Start";
import Poker from "./components/Poker";

function App() {
  const [people, setPeople] = useState([]);
  const [poker, setPoker] = useState(false);
  const [gameId, setGameId] = useState(null);
  const handleCreateGameCalled = useRef(false);

  const handleCreateGame = async () => {
    try {
      const response = await fetch("/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setGameId(data.game_id);
    } catch (error) {
      console.error("Error creating game:", error);
    }
  };

  const handleDeleteGame = (gameId) => {
    const url = `/games/delete/${gameId}`;
    const data = JSON.stringify({});
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, data);
    } else {
      fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: data,
      }).catch((error) => {
        console.error("Error deleting game:", error);
      });
    }
  };

  useEffect(() => {
    if (gameId === null && !handleCreateGameCalled.current) {
      handleCreateGame();
      handleCreateGameCalled.current = true;
    }
  }, [gameId]);

  useEffect(() => {
    const handleUnload = () => {
      if (gameId) {
        handleDeleteGame(gameId);
      }
    };

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "Are you sure you want to exit?";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("unload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("unload", handleUnload);
    };
  }, [gameId]);

  return (
    <div>
      {gameId === null ? (
        <h1>Loading...</h1>
      ) : poker ? (
        <Poker
          people={people}
          setPeople={setPeople}
          setPoker={setPoker}
          gameId={gameId}
        />
      ) : (
        <Start
          people={people}
          setPeople={setPeople}
          setPoker={setPoker}
          gameId={gameId}
        />
      )}
    </div>
  );
}

export default App;
