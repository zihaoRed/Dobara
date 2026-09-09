/** Region data for address forms — State (regionType=2) → City (regionType=4) cascade
 *  and PIN-prefix → region inference (India Post: first digit = zone, first two digits
 *  approximate to a circle/state cluster). Demo subset covering PRD's major states.
 *
 *  Full regionType hierarchy (1 country / 2 state / 3 district / 4 city / 5 locality)
 *  is a server-side master-data concept — the form exposes 2 & 4 as dropdowns,
 *  5 goes into the free-text address line, 3 is implied by city/PIN. */

export interface StateRegion {
  /** Full display name */
  name: string;
  /** Cities served (demo subset per state) */
  cities: string[];
  /** India Post PIN prefixes that fall in this state (first 2 digits, coarse) */
  pinPrefixes: string[];
}

export const STATE_REGIONS: StateRegion[] = [
  { name: 'Maharashtra', cities: ['Mumbai', 'Thane', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad'], pinPrefixes: ['40', '41', '42', '43', '44'] },
  { name: 'Delhi', cities: ['New Delhi', 'Dwarka', 'Rohini', 'Saket', 'Karol Bagh'], pinPrefixes: ['10', '11'] },
  { name: 'Karnataka', cities: ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi', 'Belagavi'], pinPrefixes: ['56', '57', '58', '59'] },
  { name: 'Tamil Nadu', cities: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'], pinPrefixes: ['60', '61', '62', '63'] },
  { name: 'Gujarat', cities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'], pinPrefixes: ['36', '37', '38', '39'] },
  { name: 'Telangana', cities: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar'], pinPrefixes: ['50'] },
  { name: 'West Bengal', cities: ['Kolkata', 'Howrah', 'Durgapur', 'Siliguri', 'Asansol'], pinPrefixes: ['70', '71', '72', '73', '74'] },
  { name: 'Uttar Pradesh', cities: ['Lucknow', 'Noida', 'Ghaziabad', 'Kanpur', 'Agra', 'Varanasi'], pinPrefixes: ['20', '21', '22', '23', '24', '25', '26', '27', '28'] },
  { name: 'Rajasthan', cities: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'], pinPrefixes: ['30', '31', '32', '33', '34'] },
];

export function citiesForState(state: string): string[] {
  return STATE_REGIONS.find((s) => s.name === state)?.cities ?? [];
}

export function stateForPin(pin: string): string | null {
  if (!/^\d{6}$/.test(pin)) return null;
  const prefix2 = pin.slice(0, 2);
  return STATE_REGIONS.find((s) => s.pinPrefixes.includes(prefix2))?.name ?? null;
}

/** Cross-check: does this PIN plausibly belong to this state? (coarse, 2-digit) */
export function pinMatchesState(pin: string, state: string): boolean {
  const inferred = stateForPin(pin);
  if (!inferred) return true; // unknown prefix — don't block (PRD: 提示但允许确认保存)
  return inferred === state;
}
