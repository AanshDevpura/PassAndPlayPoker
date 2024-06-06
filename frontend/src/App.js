import React, { useState } from "react";
import "./App.css";
import Start from "./components/Start";
import Poker from "./components/Poker";

function App() {
  const [people, setPeople] = useState([]);
  const [poker, setPoker] = useState(false);

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
