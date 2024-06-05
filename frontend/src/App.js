import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Start from "./components/Start";
import Poker from "./components/Poker";

function App() {
  const [people, setPeople] = useState([]);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<Start people={people} setPeople={setPeople} />}
        />
        <Route
          path="/poker"
          element={<Poker people={people} setPeople={setPeople} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
