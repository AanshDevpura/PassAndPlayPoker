import React, { useState, useEffect } from 'react';
import './Start.css';
import NamesList from './NamesList';
import NamesForm from './NamesForm';
import { fetchPeople, fetchBigBlind } from './Api';
import { useNavigate } from 'react-router-dom';

const Start = ({ people, setPeople, bigBlind, setBigBlind}) => {
  const [newPerson, setNewPerson] = useState({ name: '', dollars: '' });
  const [editIndex, setEditIndex] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPeople(setPeople);
  }, [setPeople]);

  useEffect(() => {
    fetchBigBlind(setBigBlind);
  }, [setBigBlind]);
  
  const handleAddPerson = async () => {
    if (people.length >= 10) {
      alert('Cannot add more than 10 people');
      return;
    }
    if (newPerson.name.trim() === '' || newPerson.dollars.trim() === '') {
      alert('Name and dollar amount are required');
      return;
    }
    if (people.some(person => person.name === newPerson.name)) {
      alert('Name already exists');
      return;
    }
    try {
      const response = await fetch('/people', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPerson),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setNewPerson({ ...newPerson, name: '' });
      fetchPeople(setPeople);
    } catch (error) {
      console.error('Error adding person:', error);
    }
  };

  const handleEditPerson = (person) => {
    setEditIndex(person._id);
    setNewPerson({ name: person.name, dollars: person.dollars.toString() });
  };

  const handleUpdatePerson = async () => {
    if (newPerson.name.trim() === '' || newPerson.dollars.trim() === '') {
      alert('Name and dollar amount are required');
      return;
    }
    if (people.some(person => person.name === newPerson.name && person._id !== editIndex)) {
      alert('Name already exists');
      return;
    }
    try {
      const response = await fetch(`/people/${editIndex}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPerson),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setNewPerson({ ...newPerson, name: '' });
      setEditIndex(null);
      fetchPeople(setPeople);
    } catch (error) {
      console.error('Error updating person:', error);
    }
  };

  const handleDeletePerson = async (personId) => {
    try {
      const response = await fetch(`/people/${personId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      fetchPeople(setPeople);
    } catch (error) {
      console.error('Error deleting person:', error);
    }
  };

  const handleBigBlind = async () => {
    try {
      const response = await fetch('/poker/big_blind', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bigBlind }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error setting big blind:', error);
    }
  };

  const handlePlayPoker = async () => {
    await handleBigBlind();
    navigate('/poker');
  };

  const handleBlindChange = (e) => {
    if (e.target.value < 0) {
      setBigBlind(0)
      alert("Please enter a positive number for Big Blind.");
    } else {
      setBigBlind(e.target.value)
    }
  };

  return (
    <div className="start">
      <h1>People</h1>
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
          min="0"
          step="0.2"
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