import React, { useState, useEffect } from "react";
import "./Poker.css";

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

function Poker({ people, setPeople, setPoker, gameId, fetchPeople }) {
  const [boardCards, setBoardCards] = useState([]);
  const [gameState, setGameState] = useState(-1);
  const [current, setCurrent] = useState(-1);
  const [currentLeader, setCurrentLeader] = useState(-1);
  const [betPerPerson, setBetPerPerson] = useState(0);
  const [pot, setPot] = useState(0);
  const [minRaise, setMinRaise] = useState(0);
  const [raise, setRaise] = useState("");
  const [dealer, setDealer] = useState(-1);
  const [smallBlindPlayer, setSmallBlindPLayer] = useState(-1);
  const [bigBlindPlayer, setBigBlindPlayer] = useState(-1);
  const [playerPositions, setPlayerPositions] = useState([]);

  useEffect(() => {
    fetchPeople(gameId, setPeople);
  }, [setPeople, gameId]);

  useEffect(() => {
    getBoardVariables();
  }, []);

  useEffect(() => {
    const updatePlayerPositions = () => {
      setPlayerPositions(
        people.map((_, index) => getPlayerPosition(index, people.length))
      );
    };
    updatePlayerPositions();
    window.addEventListener("resize", updatePlayerPositions);
    return () => {
      window.removeEventListener("resize", updatePlayerPositions);
    };
  }, [people]);

  const getBoardVariables = async () => {
    try {
      const response = await fetch(`/games/${gameId}/poker/board`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setBoardCards(data.board_cards || []);
      setPot(data.pot || 0);
      setBetPerPerson(data.bet_per_person || 0);
      setMinRaise(data.min_raise || 0);
      setGameState(data.game_state != null ? data.game_state : -1);
      setCurrent(data.current != null ? data.current : -1);
      setCurrentLeader(data.current_leader != null ? data.current_leader : -1);
      setDealer(data.dealer != null ? data.dealer : -1);
      setSmallBlindPLayer(
        data.small_blind_player != null ? data.small_blind_player : -1
      );
      setBigBlindPlayer(
        data.big_blind_player != null ? data.big_blind_player : -1
      );
      setRaise("");
    } catch (error) {
      console.error("Error fetching board variables:", error);
    }
  };

  const handleRaise = async (personId, amount) => {
    amount = Number(amount) * 100;
    const index = people.findIndex((p) => p._id === personId);
    const person = people[index];
    if (
      amount < minRaise &&
      person.cents >= minRaise + betPerPerson - person.betted
    ) {
      alert(
        `Raise amount must be at least ${
          minRaise / 100
        } unless you are going all in`
      );
      return;
    }
    if (
      person.cents < minRaise + betPerPerson - person.betted &&
      person.cents > amount + betPerPerson - person.betted
    ) {
      alert(
        `To raise you must go all in with ${person.cents / 100} by raising ${
          (person.cents - betPerPerson + person.betted) / 100
        }`
      );
      return;
    }
    if (amount + betPerPerson - person.betted > person.cents) {
      alert(`You do not have enough money to raise ${amount / 100}`);
      return;
    }
    try {
      const response = await fetch(`/games/${gameId}/poker/raise/${personId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      fetchPeople(gameId, setPeople);
      getBoardVariables();
    } catch (error) {
      console.error("Error raising:", error);
    }
  };

  const handleCall = async (personId) => {
    try {
      const response = await fetch(`/games/${gameId}/poker/call/${personId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      fetchPeople(gameId, setPeople);
      getBoardVariables();
    } catch (error) {
      console.error("Error calling:", error);
    }
  };

  const handleFold = async (personId) => {
    try {
      const response = await fetch(`/games/${gameId}/poker/fold/${personId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      fetchPeople(gameId, setPeople);
      getBoardVariables();
    } catch (error) {
      console.error("Error folding:", error);
    }
  };

  const handleDeal = async () => {
    try {
      const response = await fetch(`/games/${gameId}/poker/deal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      fetchPeople(gameId, setPeople);
      getBoardVariables();
    } catch (error) {
      console.error("Error dealing:", error);
    }
  };

  const toggleShowHand = async (index, personId) => {
    if (index !== current) {
      return;
    }
    try {
      const response = await fetch(`/games/${gameId}/poker/show/${personId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      fetchPeople(gameId, setPeople);
    } catch (error) {
      console.error("Error showing hand:", error);
    }
  };

  const handleEditPlayers = async () => {
    setPoker(false);
  };

  return (
    <div>
      <div className="table">
        <div className="players">
          {people.map((person, index) => {
            const playerPosition = playerPositions[index] || { x: 0, y: 0 };
            return (
              <div
                className="outer-player-container"
                style={{ top: playerPosition.y, left: playerPosition.x }}
                key={index}
              >
                <div
                  className={`player-info-container ${
                    index === current ? "current" : ""
                  } ${index === currentLeader ? "current-leader" : ""}`}
                >
                  {gameState !== -1 && index === dealer && (
                    <span className="poker-d">D</span>
                  )}
                  {index === smallBlindPlayer && (
                    <span className="poker-sb">SB</span>
                  )}
                  {index === bigBlindPlayer && (
                    <span className="poker-bb">BB</span>
                  )}
                  <span className="poker-name">{person.name}</span>
                  <span
                    className={`poker-dollars ${
                      person.cents === 0 ? "zero-dollars" : ""
                    }`}
                  >
                    ${person.cents / 100}
                  </span>
                  {gameState === 4 && person.won > 0 && (
                    <span className={"poker-won"}>
                      {"+"}${person.won / 100}
                    </span>
                  )}
                </div>
                {person.show && person.score_str && (
                  <span className="poker-score_str">{person.score_str}</span>
                )}
                {person.hand && (
                  <div>
                    <div
                      className="player-cards"
                      onClick={() => toggleShowHand(index, person._id)}
                    >
                      {person.show ? (
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
                        <div className="button-container">
                          <button
                            onClick={() => handleFold(person._id)}
                            className="button2"
                          >
                            Fold
                          </button>
                          {betPerPerson - person.betted === 0 ? (
                            <button
                              onClick={() => handleCall(person._id)}
                              className="button2"
                            >
                              Check
                            </button>
                          ) : (
                            <button
                              onClick={() => handleCall(person._id)}
                              className="button2"
                            >
                              Call:{" "}
                              {Math.min(
                                person.cents,
                                betPerPerson - person.betted
                              ) / 100}
                            </button>
                          )}
                        </div>
                        {person.can_raise &&
                          person.cents - betPerPerson + person.betted > 0 && (
                            <div>
                              <input
                                className="raise-input"
                                type="number"
                                value={raise}
                                onChange={(e) => {
                                  const inputValue = e.target.value;
                                  if (
                                    !inputValue ||
                                    /^\d*\.?\d{0,2}$/.test(inputValue)
                                  ) {
                                    setRaise(inputValue);
                                  }
                                }}
                                placeholder={`Min: ${
                                  Math.min(
                                    minRaise,
                                    person.cents - betPerPerson + person.betted
                                  ) / 100
                                }, Max: ${
                                  (person.cents -
                                    betPerPerson +
                                    person.betted) /
                                  100
                                }`}
                                title={`Min: ${
                                  Math.min(
                                    minRaise,
                                    person.cents - betPerPerson + person.betted
                                  ) / 100
                                }, Max: ${
                                  (person.cents -
                                    betPerPerson +
                                    person.betted) /
                                  100
                                }`}
                              />
                              <button
                                onClick={() => handleRaise(person._id, raise)}
                                className="button2"
                              >
                                Raise
                              </button>
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
      {gameState === 4 || gameState === -1 ? (
        <div className="actions button-container2">
          <button
            onClick={handleDeal}
            className="button button-poker"
            disabled={people.filter((person) => person.cents > 0).length < 2}
          >
            Deal
          </button>
          <button onClick={handleEditPlayers} className="button button-poker">
            Edit Players
          </button>
        </div>
      ) : (
        <div className="pot">Pot: ${pot / 100}</div>
      )}
    </div>
  );
}

export default Poker;
