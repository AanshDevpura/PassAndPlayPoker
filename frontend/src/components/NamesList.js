import React from "react";
import "./NamesList.css";

const NamesList = ({
  people,
  handleEditPerson,
  handleDeletePerson,
  editIndex,
}) => {
  return (
    <ul className="names-list">
      {people.map((person) => (
        <li
          className={`names-list-item ${
            editIndex === person._id ? "editing" : ""
          }`}
          key={person._id}
        >
          <span className="list-name-and-dollars">{person.name}</span>
          <span className="list-name-and-dollars">${person.cents / 100}</span>
          <div className="button-container">
            <button
              className="button button-update"
              onClick={() => handleEditPerson(person)}
              disabled={editIndex !== null}
            >
              Edit
            </button>
            <button
              className="button button-delete"
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
