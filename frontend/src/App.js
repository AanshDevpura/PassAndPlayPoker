import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';
import './App.css';
import NamesList from './components/NamesList';
import NamesForm from './components/NamesForm';

const App = () => {
  const [people, setPeople] = useState([]);
  const [newPerson, setNewPerson] = useState({ name: '', dollars: '' });
  const [editIndex, setEditIndex] = useState(null);

  useEffect(() => {
    fetchPeople();
  }, []);

  const fetchPeople = async () => {
    try {
      const response = await fetch('/people');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPeople(data);
    } catch (error) {
      console.error('Error fetching people:', error);
    }
  };

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
      setNewPerson({ name: '', dollars: '' });
      await fetchPeople();
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
      setNewPerson({ name: '', dollars: '' });
      setEditIndex(null);
      await fetchPeople();
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
      await fetchPeople();
    } catch (error) {
      console.error('Error deleting person:', error);
    }
  };

  return (
    <div className="App">
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
    </div>
  );
};

export default App;
