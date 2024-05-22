import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const [people, setPeople] = useState([]);
  const [newPerson, setNewPerson] = useState('');
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
    if (newPerson.trim() === '') {
      alert('Name is required');
      return;
    }
    try {
      const response = await fetch('/people', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newPerson }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Person added:', data); // Debug log
      setNewPerson('');
      await fetchPeople();
    } catch (error) {
      console.error('Error adding person:', error);
    }
  };

  const handleEditPerson = (person) => {
    setEditIndex(person._id);
    setNewPerson(person.name);
  };

  const handleUpdatePerson = async () => {
    if (newPerson.trim() === '') {
      alert('Name is required');
      return;
    }
    try {
      const response = await fetch(`/people/${editIndex}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newPerson }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Person updated:', data); // Debug log
      setNewPerson('');
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
      <div className="input-button-container">
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={newPerson}
          onChange={(e) => setNewPerson(e.target.value)}
        />
        {editIndex !== null ? (
          <button className="button-update" onClick={handleUpdatePerson}>
            Update Person
          </button>
        ) : (
          <button className="button-add" onClick={handleAddPerson}>
            Add Person
          </button>
        )}
      </div>
      <ul>
        {people.map((person) => (
          <li key={person._id}>
            {person.name}
            <div className="button-container">
              <button
                className="button-update"
                onClick={() => handleEditPerson(person)}
                disabled={editIndex !== null}
              >
                Edit
              </button>
              <button
                className="button-delete"
                onClick={() => handleDeletePerson(person._id)}
                disabled={editIndex !== null}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;