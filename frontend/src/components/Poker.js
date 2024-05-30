import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchPeople} from './Api';
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

function Poker({ people, setPeople}) {
  const [boardCards, setBoardCards] = useState([]);
  const [gameState, setGameState] = useState(4);
  const [showHands, setShowHands] = useState([]);
  const [current, setCurrent] = useState(-1);
  const [betPerPerson, setBetPerPerson] = useState(0);
  const [pot, setPot] = useState(0);
  const [minRaise, setMinRaise] = useState(0);
  const [raise, setRaise] = useState('');
  const [dealer, setDealer] = useState(-1);
  const [smallBlindPlayer, setSmallBlindPLayer] = useState(-1);
  const [bigBlindPlayer, setBigBlindPlayer] = useState(-1);

  const getBoardVariables = async () => {
    try {
      const response = await fetch('/poker/board', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setBoardCards(data.board_cards || []);
      setPot(data.pot || 0);
      setBetPerPerson(data.bet_per_person || 0);
      setCurrent(data.current || 0);
      setMinRaise(data.min_raise || 0);
      setGameState(data.game_state != null ? data.game_state : 4);
      if (data.game_state === 4) {
        setShowHands(new Array(people.length).fill(true));
      }
      setDealer(data.dealer || 0);
      setSmallBlindPLayer(data.small_blind_player || 0);
      setBigBlindPlayer(data.big_blind_player || 0);
      setRaise('');
    }
    catch (error) {
      console.error('Error fetching board variables:', error);
    }
  }

  const handleRaise = async (personId, amount) => {
    const index = people.findIndex(p => p._id === personId);
    const person = people[index];
    amount = Number(amount);
    if (amount < minRaise && person.dollars >= (minRaise + betPerPerson - person.betted)) {
      alert(`Raise amount must be at least ${minRaise} unless you are going all in`);
      return;
    }
    if (person.dollars < (minRaise + betPerPerson - person.betted) && person.dollars > (amount + betPerPerson - person.betted)) {
      alert(`To raise you must go all in with ${person.dollars} by raising ${person.dollars - betPerPerson + person.betted}`);
      return;
    }
    if ((amount + betPerPerson - person.betted) > person.dollars) {
      alert(`You do not have enough money to raise ${amount}`);
      return;
    }
    try {
      const response = await fetch(`/poker/raise/${personId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await fetchPeople(setPeople);
      await getBoardVariables();
    } catch (error) {
      console.error('Error raising:', error);
    }
  };

  const handleCall = async (personId) => {
    try {
      const response = await fetch(`/poker/call/${personId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await fetchPeople(setPeople);
      await getBoardVariables();
      setRaise('');
    } catch (error) {
      console.error('Error calling:', error);
    }
  };

  const handleFold = async (personId) => {
    try {
      const response = await fetch(`/poker/fold/${personId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await fetchPeople(setPeople);
      await getBoardVariables();
    } catch (error) {
      console.error('Error folding:', error);
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
      await fetchPeople(setPeople);
      await getBoardVariables();
      setShowHands(new Array(people.length).fill(false));
    } catch (error) {
      console.error('Error dealing:', error);
    }
  };


  const toggleShowHand = (index) => {
    if (index === current) {
      setShowHands(prev => {
        const newShowHands = [...prev];
        newShowHands[index] = !newShowHands[index];
        return newShowHands;
      });
    }
  };

  return (
    <div>
      <div>
      {gameState === 4 && (
      <div>
        <button
          onClick={handleDeal}
          disabled={people.filter(person => person.dollars > 0).length < 2}
        >
          Deal
        </button>
        <Link to="/">
          <button>Edit Players</button>
        </Link>
      </div>
    )}
      </div>
      <div className="pot">Pot: ${pot}</div>
      <div className="gameState">Game State: {gameState}</div>
      <div className="table">
        <div className="players">
          {people.map((person, index) => {
            const playerPosition = getPlayerPosition(index, people.length);
            return (
              <div className="outer-player-container" style={{ top: playerPosition.y, left: playerPosition.x }} key={index}>
                <div className="player-info-container">
                  {index === dealer && <span className="poker-d">D</span>}
                  {index === smallBlindPlayer && <span className="poker-sb">SB</span>}
                  {index === bigBlindPlayer && <span className="poker-bb">BB</span>}
                  <span className="poker-name">{person.name}</span>
                  <span className={`poker-dollars ${person.dollars === 0 ? 'zero-dollars' : ''}`}>
                    ${person.dollars.toFixed(2)}
                  </span>
                </div>

                {person.hand && (
                  <div>
                    <div className="player-cards" onClick={() => toggleShowHand(index)}>
                      {showHands[index] ? (
                        <div>
                          <card-t cid={person.hand[0]}></card-t>
                          <card-t cid={person.hand[1]}></card-t>
                        </div>
                      ) : (
                        <div>
                          <card-t cid="00"></card-t>
                          <card-t cid="00"></card-t>
                        </div>
                      )}
                    </div>

                    {index === current && (
                      <div>
                        <button onClick={() => handleFold(person._id)}>Fold</button>
                        {betPerPerson - person.betted === 0 ?(
                          <button onClick={() => handleCall(person._id)}>Check</button>
                        ) : (
                          <button onClick={() => handleCall(person._id)}>Call: {Math.min(person.dollars, betPerPerson - person.betted)}</button>
                        )}
                        {person.can_raise && person.dollars - betPerPerson + person.betted > 0 && (
                          <div>
                            <input
                              type="number"
                              value={raise}
                              onChange={(e) => setRaise(e.target.value)}
                              placeholder={`Min: ${Math.min(minRaise, person.dollars - betPerPerson + person.betted)}, Max: ${person.dollars - betPerPerson + person.betted}`}
                            />
                            <button onClick={() => handleRaise(person._id, raise)}>Raise</button>
                          </div>
                        )}
                      </div>
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
