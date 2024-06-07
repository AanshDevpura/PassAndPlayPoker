import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import Start from "./components/Start";
import Poker from "./components/Poker";

function App() {
  const [people, setPeople] = useState([]);
  const [poker, setPoker] = useState(localStorage.getItem("poker") === "true");
  const [gameId, setGameId] = useState(localStorage.getItem("gameId") || null);
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

  const handleDeleteGame = async (gameId) => {
    try {
      const response = await fetch(`/games/${gameId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setGameId(null);
    } catch (error) {
      console.error("Error deleting game:", error);
    }
  };

  useEffect(() => {
    if (gameId === null && !handleCreateGameCalled.current) {
      handleCreateGame();
      handleCreateGameCalled.current = true;
    }
  }, [gameId]);

  useEffect(() => {
    localStorage.setItem("poker", poker);
  }, [poker]);

  useEffect(() => {
    localStorage.setItem("gameId", gameId);
  }, [gameId]);

  useEffect(() => {
    const handleUnload = () => {
      handleDeleteGame(gameId);
      localStorage.removeItem("poker");
      localStorage.removeItem("gameId");
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
