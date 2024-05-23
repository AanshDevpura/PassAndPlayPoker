import React from 'react';
import './NamesForm.css';

const NamesForm = ({ newPerson, setNewPerson, handleAddPerson, handleUpdatePerson, editIndex }) => {
  
  const handleDollarsChange = (e) => {
    if (e.target.value < 0) {
      setNewPerson({ ...newPerson, dollars: '' });
      alert("Please enter a positive number for dollars.");
    } else {
      setNewPerson({ ...newPerson, dollars: e.target.value });
    }
  };

  return (
    <div className="input-button-container">
      <input
        className='names-form-input'
        type="text"
        name="name"
        placeholder="Name"
        value={newPerson.name}
        onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
      />
      <input
        className='names-form-input'
        type="number"
        name="dollars"
        placeholder="Dollars"
        min = "0"
        step = "10"
        value={newPerson.dollars}
        onChange={handleDollarsChange}
      />
      {editIndex !== null ? (
        <button className="button button-update" onClick={handleUpdatePerson}>
          Update Person
        </button>
      ) : (
        <button className="button button-add" onClick={handleAddPerson}>
          Add Person
        </button>
      )}
    </div>
  );
};

export default NamesForm;
