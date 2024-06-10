import React, { useState, useEffect, useRef } from "react";
import "./Start.css";
import NamesList from "./NamesList";
import NamesForm from "./NamesForm";

const Start = ({ people, setPeople, setPoker, gameId, fetchPeople }) => {
  const [newPerson, setNewPerson] = useState({ name: "", dollars: "" });
  const [bigBlind, setBigBlind] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const handleUndealCalled = useRef(false);

  useEffect(() => {
    const handleUndeal = async () => {
      try {
        const response = await fetch(`games/${gameId}/poker/undeal`, {
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
        console.error("Error undealing:", error);
      }
    };
    if (!handleUndealCalled.current) {
      handleUndeal();
      handleUndealCalled.current = true;
    }
  }, [gameId, setPeople]);

  useEffect(() => {
    const fetchBigBlind = async (setBigBlind) => {
      try {
        const response = await fetch(`games/${gameId}/poker/big_blind`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setBigBlind(data);
      } catch (error) {
        console.error("Error fetching big blind:", error);
      }
    };
    fetchBigBlind(setBigBlind);
  }, [gameId, setBigBlind]);

  const handleAddPerson = async () => {
    if (people.length >= 10) {
      alert("Cannot add more than 10 people");
      return;
    }
    if (newPerson.name.trim() === "" || newPerson.dollars.trim() === "") {
      alert("Name and dollar amount are required");
      return;
    }
    if (people.some((person) => person.name === newPerson.name)) {
      alert("Name already exists");
      return;
    }
    try {
      const response = await fetch(`/games/${gameId}/people`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPerson),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setNewPerson({ ...newPerson, name: "" });
      fetchPeople(gameId, setPeople);
    } catch (error) {
      console.error("Error adding person:", error);
    }
  };

  const handleEditPerson = (person) => {
    setEditIndex(person._id);
    setNewPerson({
      name: person.name,
      dollars: (person.cents / 100).toString(),
    });
  };

  const handleUpdatePerson = async () => {
    if (newPerson.name.trim() === "" || newPerson.dollars.trim() === "") {
      alert("Name and dollar amount are required");
      return;
    }
    if (
      people.some(
        (person) => person.name === newPerson.name && person._id !== editIndex
      )
    ) {
      alert("Name already exists");
      return;
    }
    try {
      const response = await fetch(`games/${gameId}/people/${editIndex}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPerson),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setNewPerson({ ...newPerson, name: "" });
      setEditIndex(null);
      fetchPeople(gameId, setPeople);
    } catch (error) {
      console.error("Error updating person:", error);
    }
  };

  const handleDeletePerson = async (personId) => {
    try {
      const response = await fetch(`games/${gameId}/people/${personId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      fetchPeople(gameId, setPeople);
    } catch (error) {
      console.error("Error deleting person:", error);
    }
  };

  const handleBigBlind = async () => {
    try {
      const response = await fetch(`games/${gameId}/poker/big_blind`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bigBlind }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error setting big blind:", error);
    }
  };

  const handlePlayPoker = async () => {
    await handleBigBlind();
    setPoker(true);
  };

  const handleBlindChange = (e) => {
    if (e.target.value < 0) {
      setBigBlind("");
      alert("Please enter a positive number for Big Blind.");
    } else if (e.target.value > 1000000) {
      setBigBlind("1000000");
      alert("The number cannot be greater than 1,000,000 dollars.");
    } else {
      const inputValue = e.target.value;
      if (!inputValue || /^\d*\.?\d{0,2}$/.test(inputValue)) {
        // Check if the second decimal place is even, if it exists
        const decimalPart = inputValue.split(".")[1];
        if (
          !decimalPart ||
          decimalPart.length < 2 ||
          decimalPart[1] % 2 === 0
        ) {
          setBigBlind(inputValue);
        } else {
          alert("The second decimal place must be even.");
        }
      }
    }
  };
  return (
    <div className="start">
      <h1>Cash In and Out</h1>
      <NamesForm
        newPerson={newPerson}
        setNewPerson={setNewPerson}
        handleAddPerson={handleAddPerson}
        handleUpdatePerson={handleUpdatePerson}
        editIndex={editIndex}
      />
      <NamesList
        people={people}
        handleEditPerson={handleEditPerson}
        handleDeletePerson={handleDeletePerson}
        editIndex={editIndex}
      />
      <div className="poker-button-container">
        <input
          className="big-blind-input"
          type="number"
          name="Big Blind"
          placeholder="Big Blind"
          value={bigBlind}
          onChange={handleBlindChange}
        />
        <button
          className="button button-poker"
          disabled={editIndex !== null || bigBlind === "" || people.length < 2}
          onClick={handlePlayPoker}
        >
          Play Poker
        </button>
      </div>
    </div>
  );
};

export default Start;
