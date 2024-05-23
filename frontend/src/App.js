import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Start from './components/Start';
import Poker from './components/Poker';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Start />} />
        <Route path='/poker' element={<Poker />} />
      </Routes>
    </Router>
  );
}

export default App;
