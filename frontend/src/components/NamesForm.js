import React from 'react';
import './NamesForm.css';

const NamesForm = ({ newPerson, setNewPerson, handleAddPerson, handleUpdatePerson, editIndex }) => {
  
  return (
    <div className="input-button-container">
      <input
        type="text"
        name="name"
        placeholder="Name"
        value={newPerson.name}
        onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
      />
      <input
        type="number"
        name="dollars"
        placeholder="Dollars"
        value={newPerson.dollars}
        min="0" // Setting the min attribute to enforce a minimum value of 0
        onChange={(e) => setNewPerson({ ...newPerson, dollars: e.target.value })}
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
  );
};

export default NamesForm;
