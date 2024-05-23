export const fetchPeople = async () => {
  try {
    const response = await fetch('/people');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching people:', error);
  }
};