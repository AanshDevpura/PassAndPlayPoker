import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchPeople } from './Api';
import './Poker.css';

function Poker({ people, setPeople }) {
  const [boardCards, setBoardCards] = useState([]);
  const [gameState, setGameState] = useState(0);

  useEffect(() => {
    fetchPeople(setPeople);
  }, [setPeople]);


  const handleDeal = async () => {
    try {
      const response = await fetch('poker/deal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchBoardCards();
    } catch (error) {
      console.error('Error dealing:', error);
    }
  };

  const updateGameState = async () => {
    setGameState((prev) => prev + 1);
    fetchBoardCards();
  };

  const fetchBoardCards = async () => {
    try {
      const response = await fetch('poker/board_cards', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setBoardCards(data);
      console.log(data); // debug log
    } catch (error) {
      console.error('Error fetching board cards:', error);
    }
  };

  return (
    <div>
      <h1>Poker</h1>
      <button onClick={handleDeal}>Deal</button>
      <button onClick={updateGameState}>Next State</button>
      <Link to="/">
        <button>Edit Players</button>
      </Link>
      <div className="table">
        <div className="player-rectangle">
          {people.map((person, index) => {
            const perimeter = 3500;
            let x = 500 + (perimeter * (index)) / people.length;
            let y = 0;
            if (x > 1000) {
              y = x - 1000;
              x = 1000;
            }
            if (y > 750) {
              x -= y - 750;
              y = 750;
            }
            if (x < 0) {
              y += x;
              x = 0;
            }
            if (y < 0) {
              x -= y;
              y = 0;
            }

            return (
              <div key={index} className="player-name" style={{ top: y, left: x }}>
                <span className="name-and-dollars">{person.name}</span>
                <span className="name-and-dollars">${person.dollars}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="board">
        <div className="flop">
          {gameState >= 1 ? (
            <>
              <card-t cid={boardCards[0]} className="card"></card-t>
              <card-t cid={boardCards[1]} className="card"></card-t>
              <card-t cid={boardCards[2]} className="card"></card-t>
            </>
          ) : (
            <>
              <card-t cid="00" className="card" backcolor="#000" backtext=""></card-t>
              <card-t cid="00" className="card" backcolor="#000" backtext=""></card-t>
              <card-t cid="00" className="card" backcolor="#000" backtext=""></card-t>
            </>
          )}
        </div>
        <div className="turn">
          {gameState >= 2 ? (
            <card-t cid={boardCards[3]} className="card"></card-t>
          ) : (
            <card-t cid="00" className="card" backcolor="#000" backtext=""></card-t>
          )}
        </div>
        <div className="river">
          {gameState >= 3 ? (
            <card-t cid={boardCards[4]} className="card"></card-t>
          ) : (
            <card-t cid="00" className="card" backcolor="#000" backtext=""></card-t>
          )}
        </div>
      </div>
    </div>
  );
}

export default Poker;