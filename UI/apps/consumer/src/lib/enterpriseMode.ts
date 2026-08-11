const MODE_KEY = 'dobara_enterprise_mode';
const CART_KEY = 'dobara_enterprise_cart';

export type EnterpriseCartLine = {
  imei: string;
  brand: string;
  model: string;
  grade: string;
  storage: string;
  color: string;
  price: number;
  qty: number;
};

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
    const parsed = JSON.parse(raw) as EnterpriseCartLine[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setEnterpriseCart(lines: EnterpriseCartLine[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(lines));
  window.dispatchEvent(new Event('dobara-enterprise-cart'));
}

export function addToEnterpriseCart(line: Omit<EnterpriseCartLine, 'qty'>, qty = 1) {
  const cart = getEnterpriseCart();
  const existing = cart.find((l) => l.imei === line.imei);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ ...line, qty });
  }
  setEnterpriseCart(cart);
  return cart;
}

export function updateEnterpriseCartQty(imei: string, qty: number) {
  const cart = getEnterpriseCart()
    .map((l) => (l.imei === imei ? { ...l, qty } : l))
    .filter((l) => l.qty > 0);
  setEnterpriseCart(cart);
  return cart;
}

export function clearEnterpriseCart() {
  setEnterpriseCart([]);
}

export function enterpriseCartCount(): number {
  return getEnterpriseCart().reduce((n, l) => n + l.qty, 0);
}

export function enterpriseCartTotal(): number {
  return getEnterpriseCart().reduce((n, l) => n + l.price * l.qty, 0);
}
