const CITY_KEY = 'dobara_user_city';

/** Cities with warehouses (demo subset — same list used by store appointment). */
export const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune'];

export function getUserCity(): string {
  try {
    return localStorage.getItem(CITY_KEY) || 'Mumbai';
  } catch {
    return 'Mumbai';
  }
}

export function setUserCity(city: string) {
  localStorage.setItem(CITY_KEY, city);
  window.dispatchEvent(new Event('dobara-user-city'));
}
