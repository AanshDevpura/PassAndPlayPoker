import React, { useState, useEffect } from 'react';
import './Start.css';
import NamesList from './NamesList';
import NamesForm from './NamesForm';
import { fetchPeople } from './Api';
import {Link } from 'react-router-dom';

const Start = () => {
  const [people, setPeople] = useState([]);
  const [newPerson, setNewPerson] = useState({ name: '', dollars: '' });
  const [editIndex, setEditIndex] = useState(null);

  useEffect(() => {
    fetchPeople().then(setPeople);
  }, []);

  const handleAddPerson = async () => {
    if (people.length >= 10) {
      alert('Cannot add more than 10 people');
      return;
    }
    if (newPerson.name.trim() === '' || newPerson.dollars.trim() === '') {
      alert('Name and dollar amount are required');
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
      const data = await response.json();
      console.log('Person added:', data); // Debug log
      setNewPerson({ ...newPerson, name: ''});
      await fetchPeople().then(setPeople);
    } catch (error) {
      console.error('Error adding person:', error);
    }
  };

  const handleEditPerson = (person) => {
    setEditIndex(person._id);
    setNewPerson({ name: person.name, dollars: person.dollars.toString() });
  };

  const handleUpdatePerson = async () => {
    console.log(newPerson.dollars)
    if (newPerson.name.trim() === '' || newPerson.dollars.trim() === '') {
      alert('Name and dollar amount are required');
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
      const data = await response.json();
      console.log('Person updated:', data); // Debug log
      setNewPerson({ ...newPerson, name: '' });
      setEditIndex(null);
      await fetchPeople().then(setPeople);
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
      const data = await response.json();
      console.log('Person deleted:', data); // Debug log
      await fetchPeople().then(setPeople);
    } catch (error) {
      console.error('Error deleting person:', error);
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
      <div className="button-container">
        <Link to="/poker">
          <button
          className='button-poker'
          disabled={editIndex !== null || people.length < 2}
          >
            Play Poker
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Start;

