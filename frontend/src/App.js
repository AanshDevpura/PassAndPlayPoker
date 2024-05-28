import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Start from './components/Start';
import Poker from './components/Poker';
import { fetchPeople } from './components/Api';

function App() {
  const [people, setPeople] = useState([]);
  const [bigBlind, setBigBlind] = useState('');

  useEffect(() => {
    fetchPeople(setPeople);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path='/' element={<Start people={people} setPeople={setPeople} bigBlind ={bigBlind} setBigBlind={setBigBlind}/>} />
        <Route path='/poker' element={<Poker people={people} setPeople={setPeople} bigBlind={bigBlind} setBigBlind={setBigBlind} />} />
      </Routes>
    </Router>
  );
}

export default App;
