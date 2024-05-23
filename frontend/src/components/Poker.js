import React from 'react';

function Poker() {
    const handleDeal = async () => {
        try {
          const response = await fetch('/people/deal', {
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
        </div>
    );
}

export default Poker;