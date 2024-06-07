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

  return (
    <div>
      {gameId === null ? (
        <div>Loading...</div>
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
