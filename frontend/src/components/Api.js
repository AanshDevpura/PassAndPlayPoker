export const fetchPeople = async (setPeople) => {
  try {
    const response = await fetch('/people');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    setPeople(data);
    return data;
  } catch (error) {
    console.error('Error fetching people:', error);
  }
};


export const fetchBigBlind = async (setBigBlind) => {
  try {
    const response = await fetch('/poker/big_blind');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    setBigBlind(data);
    return data;
  } catch (error) {
    console.error('Error fetching bigblind:', error);
  }
};