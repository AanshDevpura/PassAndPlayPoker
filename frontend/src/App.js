import React, { useState, useEffect } from "react";
import "./App.css";
import Start from "./components/Start";
import Poker from "./components/Poker";

function App() {
  const [people, setPeople] = useState([]);
  const [poker, setPoker] = useState(() => {
    const savedPoker = localStorage.getItem("poker");
    return savedPoker ? JSON.parse(savedPoker) : false;
  });

  useEffect(() => {
    localStorage.setItem("poker", JSON.stringify(poker));
  }, [poker]);

  return (
    <div>
      {poker ? (
        <Poker people={people} setPeople={setPeople} setPoker={setPoker} />
      ) : (
        <Start people={people} setPeople={setPeople} setPoker={setPoker} />
      )}
    </div>
  );
}

export default App;
