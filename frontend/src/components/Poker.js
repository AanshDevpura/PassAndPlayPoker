import React from 'react';
import {Link } from 'react-router-dom';

function Poker() {
    const handleDeal = async () => {
        try {
          const response = await fetch('poker/deal', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
          });
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        } catch (error) {
          console.error('Error dealing:', error);
        }
      };
    return (
        <div>
          <h1>Poker</h1>
          <button onClick={handleDeal}>Deal</button>
          <Link to="/">
            <button>
              Edit Players
            </button>
          </Link>
          <card-t cid="00"></card-t>
        </div>
        
    );
}

export default Poker;