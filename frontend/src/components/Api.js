export const fetchPeople = async (gameId, setPeople) => {
  try {
    const response = await fetch(`/games/${gameId}/people`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    setPeople(data);
  } catch (error) {
    console.error("Error fetching people:", error);
  }
};
