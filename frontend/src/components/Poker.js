import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchPeople } from './Api';
import './Poker.css';

function getPlayerPosition(index, totalPlayers) {
  const width = window.innerWidth - 300;
  const height = window.innerHeight - 200;
  const perimeter = width * 2 + height * 2;
  let x = width / 2 + (perimeter * index) / totalPlayers;
  let y = 0;
  if (x > width) {
    y = x - width;
    x = width;
  }
  if (y > height) {
    x -= y - height;
    y = height;
  }
  if (x < 0) {
    y += x;
    x = 0;
  }
  if (y < 0) {
    x -= y;
    y = 0;
  }
  return { x, y };
}

function Poker({ people, setPeople }) {
  const [boardCards, setBoardCards] = useState([]);
  const [gameState, setGameState] = useState(0);
  const [showHands, setShowHands] = useState([]);
  const [specialPlayers, setSpecialPlayers] = useState([]);

  useEffect(() => {
    handleUndeal();
  }, []);

  const handleSpecialPlayers = async () => {
    try {
      const response = await fetch('/poker/special_players', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSpecialPlayers(data);
    } catch (error) {
      console.error('Error fetching special players:', error);
    }
  };

  const handleDeal = async () => {
    try {
      const response = await fetch('/poker/deal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchBoardCards();
      await fetchPeople(setPeople);
      await handleSpecialPlayers();
      setShowHands(new Array(people.length).fill(false));
    } catch (error) {
      console.error('Error dealing:', error);
    }
  };

  const handleUndeal = async () => {
    try {
      const response = await fetch('/poker/undeal', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await fetchBoardCards();
      await fetchPeople(setPeople);
      setGameState(0);
    } catch (error) {
      console.error('Error undealing:', error);
    }
  };

  const updateGameState = async () => {
    setGameState(prev => prev + 1);
  };

  const fetchBoardCards = async () => {
    try {
      const response = await fetch('/poker/board_cards', {
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
    } catch (error) {
      console.error('Error fetching board cards:', error);
    }
  };

  const toggleShowHand = (index) => {
    setShowHands(prev => {
      const newShowHands = [...prev];
      newShowHands[index] = !newShowHands[index];
      return newShowHands;
    });
  };

  return (
    <div>
      <button onClick={handleDeal}>Deal</button>
      <button onClick={handleUndeal}>Undeal</button>
      <button onClick={updateGameState}>Next State</button>
      <Link to="/">
        <button>Edit Players</button>
      </Link>
      <div className="table" style={{ width: window.innerWidth - 300, height: window.innerHeight - 200 }}>
        <div className="player-info">
          {people.map((person, index) => {
            const playerPosition = getPlayerPosition(index, people.length);
            return (
              <div className="outer-player-container" style={{ top: playerPosition.y, left: playerPosition.x }} key={index}>
                <div className="player-info-container">
                  {index === specialPlayers[0] && <span className="poker-d">D</span>}
                  {index === specialPlayers[1] && <span className="poker-sb">SB</span>}
                  {index === specialPlayers[2] && <span className="poker-bb">BB</span>}
                  <span className="poker-name">{person.name}</span>
                  <span className={`poker-dollars ${person.dollars === 0 ? 'zero-dollars' : ''}`}>${person.dollars}</span>
                </div>

                {person.hand && (
                  <div className="player-cards" onClick={() => toggleShowHand(index)}>
                    {showHands[index] ? (
                      <>
                        <card-t cid={person.hand[0]}></card-t>
                        <card-t cid={person.hand[1]}></card-t>
                      </>
                    ) : (
                      <>
                        <card-t cid="00"></card-t>
                        <card-t cid="00"></card-t>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {boardCards.length === 5 && (
        <div className="board">
          <div className="flop">
            {gameState >= 1 ? (
              <>
                <card-t cid={boardCards[0]}></card-t>
                <card-t cid={boardCards[1]}></card-t>
                <card-t cid={boardCards[2]}></card-t>
              </>
            ) : (
              <>
                <card-t cid="00" backtext="Flop"></card-t>
                <card-t cid="00" backtext="Flop"></card-t>
                <card-t cid="00" backtext="Flop"></card-t>
              </>
            )}
          </div>
          <div className="turn">
            {gameState >= 2 ? (
              <card-t cid={boardCards[3]}></card-t>
            ) : (
              <card-t cid="00" backtext="Turn"></card-t>
            )}
          </div>
          <div className="river">
            {gameState >= 3 ? (
              <card-t cid={boardCards[4]}></card-t>
            ) : (
              <card-t cid="00" backtext="River"></card-t>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Poker;