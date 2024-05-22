import React from 'react';
import './NamesList.css';

const NamesList = ({ people, handleEditPerson, handleDeletePerson, editIndex }) => {
  return (
    <ul>
      {people.map((person) => (
        <li key={person._id}>
          <span className="name-and-dollars">{person.name}</span>
          <span className="name-and-dollars"> ${person.dollars}</span>
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
  );
};

export default NamesList;
