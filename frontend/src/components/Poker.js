import React, { useState, useEffect } from "react";
import { fetchPeople } from "./Api";
import "./Poker.css";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  useEffect(() => {
    fetchPeople(setPeople);
    getBoardVariables();
  }, [setPeople]);

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

  useEffect(() => {
    const handlePopState = (event) => {
      const confirmExit = window.confirm(
        "Are you sure you want to exit the game? You will lose your progress."
      );
      if (confirmExit) {
        handleEditPlayers();
      } else {
        window.history.pushState(null, document.title, window.location.href);
      }
    };

    window.history.pushState(null, document.title, window.location.href);
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [navigate]);

  const getBoardVariables = async () => {
    try {
      const response = await fetch("/poker/board", {
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
    const index = people.findIndex((p) => p._id === personId);
    const person = people[index];
    amount = Number(amount);
    if (
      amount < minRaise &&
      person.dollars >= minRaise + betPerPerson - person.betted
    ) {
      alert(
        `Raise amount must be at least ${minRaise} unless you are going all in`
      );
      return;
    }
    if (
      person.dollars < minRaise + betPerPerson - person.betted &&
      person.dollars > amount + betPerPerson - person.betted
    ) {
      alert(
        `To raise you must go all in with ${person.dollars} by raising ${
          person.dollars - betPerPerson + person.betted
        }`
      );
      return;
    }
    if (amount + betPerPerson - person.betted > person.dollars) {
      alert(`You do not have enough money to raise ${amount}`);
      return;
    }
    try {
      const response = await fetch(`/poker/raise/${personId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      fetchPeople(setPeople);
      getBoardVariables();
    } catch (error) {
      console.error("Error raising:", error);
    }
  };

  const handleCall = async (personId) => {
    try {
      const response = await fetch(`/poker/call/${personId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      fetchPeople(setPeople);
      getBoardVariables();
    } catch (error) {
      console.error("Error calling:", error);
    }
  };

  const handleFold = async (personId) => {
    try {
      const response = await fetch(`/poker/fold/${personId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      fetchPeople(setPeople);
      getBoardVariables();
    } catch (error) {
      console.error("Error folding:", error);
    }
  };

  const handleDeal = async () => {
    try {
      const response = await fetch("/poker/deal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      fetchPeople(setPeople);
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
      const response = await fetch(`/poker/show/${personId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      fetchPeople(setPeople);
    } catch (error) {
      console.error("Error showing hand:", error);
    }
  };

  const handleEditPlayers = async () => {
    navigate("/");
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
                  } ${
                    index === currentLeader && gameState !== 4
                      ? "current-leader"
                      : ""
                  }`}
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
                      person.dollars === 0 ? "zero-dollars" : ""
                    }`}
                  >
                    ${person.dollars.toFixed(2)}
                  </span>
                  {gameState === 4 && person.won > 0 && (
                    <span className={"poker-won"}>
                      {"+"}${person.won.toFixed(2)}
                    </span>
                  )}
                </div>
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
                    {person.show && person.score_str && (
                      <span className="poker-score_str">
                        {person.score_str}
                      </span>
                    )}
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
                                person.dollars,
                                betPerPerson - person.betted
                              )}
                            </button>
                          )}
                        </div>
                        {person.can_raise &&
                          person.dollars - betPerPerson + person.betted > 0 && (
                            <div>
                              <input
                                className="raise-input"
                                type="number"
                                value={raise}
                                onChange={(e) => setRaise(e.target.value)}
                                placeholder={`Min: ${Math.min(
                                  minRaise,
                                  person.dollars - betPerPerson + person.betted
                                )}, Max: ${
                                  person.dollars - betPerPerson + person.betted
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
            disabled={people.filter((person) => person.dollars > 0).length < 2}
          >
            Deal
          </button>
          <button onClick={handleEditPlayers} className="button button-poker">
            Edit Players
          </button>
        </div>
      ) : (
        <div className="pot">Pot: ${pot}</div>
      )}
    </div>
  );
}

export default Poker;
