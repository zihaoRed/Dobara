const MODE_KEY = 'dobara_enterprise_mode';
const CART_KEY = 'dobara_enterprise_cart';

/** One line = one unique IMEI device (second-hand: 1 unit per device). */
export type EnterpriseCartLine = {
  imei: string;
  brand: string;
  model: string;
  grade: string;
  storage: string;
  color: string;
  price: number;
};

function normalizeLines(raw: unknown): EnterpriseCartLine[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: EnterpriseCartLine[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const line = item as EnterpriseCartLine & { qty?: number };
    if (!line.imei || seen.has(line.imei)) continue;
    seen.add(line.imei);
    out.push({
      imei: line.imei,
      brand: line.brand || '',
      model: line.model || '',
      grade: line.grade || 'A',
      storage: line.storage || '',
      color: line.color || '',
      price: Number(line.price) || 0,
    });
  }
  return out;
}

export function isEnterpriseMode(): boolean {
  try {
    return localStorage.getItem(MODE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setEnterpriseMode(enabled: boolean) {
  localStorage.setItem(MODE_KEY, enabled ? 'true' : 'false');
  window.dispatchEvent(new Event('dobara-enterprise-mode'));
}

export function getEnterpriseCart(): EnterpriseCartLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    return normalizeLines(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function setEnterpriseCart(lines: EnterpriseCartLine[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(normalizeLines(lines)));
  window.dispatchEvent(new Event('dobara-enterprise-cart'));
}

/** Add unique devices; duplicates by IMEI are ignored. */
export function addDevicesToEnterpriseCart(lines: Omit<EnterpriseCartLine, never>[]) {
  const cart = getEnterpriseCart();
  const seen = new Set(cart.map((l) => l.imei));
  for (const line of lines) {
    if (seen.has(line.imei)) continue;
    seen.add(line.imei);
    cart.push({
      imei: line.imei,
      brand: line.brand,
      model: line.model,
      grade: line.grade,
      storage: line.storage,
      color: line.color,
      price: line.price,
    });
  }
  setEnterpriseCart(cart);
  return cart;
}

export function removeFromEnterpriseCart(imei: string) {
  setEnterpriseCart(getEnterpriseCart().filter((l) => l.imei !== imei));
}

export function isInEnterpriseCart(imei: string): boolean {
  return getEnterpriseCart().some((l) => l.imei === imei);
}

export function clearEnterpriseCart() {
  setEnterpriseCart([]);
}

export function enterpriseCartCount(): number {
  return getEnterpriseCart().length;
}

export function enterpriseCartTotal(): number {
  return getEnterpriseCart().reduce((n, l) => n + l.price, 0);
}
