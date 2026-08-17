export type TMarketSourceId = 'cashify' | 'cex' | 'flipkart';

export interface IMarketSource {
  id: TMarketSourceId;
  name: string;
  domain: string;
  url: string;
  mark: string;
  accent: string;
  accentSoft: string;
  tagline: string;
  quoteRole: string;
  query: (device: string) => string;
  snippet: (device: string, quote: number) => string;
  about: string;
  coverage: string;
  freshness: string;
  method: string;
}

export const MARKET_SOURCES: IMarketSource[] = [
  {
    id: 'cashify',
    name: 'Cashify',
    domain: 'cashify.in',
    url: 'https://www.cashify.in',
    mark: 'Cf',
    accent: '#12B76A',
    accentSoft: 'rgba(18, 183, 106, 0.16)',
    tagline: 'India’s largest gadget buyback board',
    quoteRole: 'Instant sell quote',
    query: (device) => `site:cashify.in sell ${device} price India`,
    snippet: (device, quote) =>
      `${device} — instant sell ₹${quote.toLocaleString('en-IN')} · same-day pickup metros`,
    about:
      'Cashify is an Indian re-commerce marketplace for used phones. Buyback quotes are published per model and storage, then adjusted after a physical check.',
    coverage: 'Pan-India buyback · 400+ cities',
    freshness: 'Listings refresh throughout the day',
    method: 'Public sell-now quotes for matching model + storage',
  },
  {
    id: 'cex',
    name: 'CeX',
    domain: 'in.webuy.com',
    url: 'https://in.webuy.com',
    mark: 'CeX',
    accent: '#F79009',
    accentSoft: 'rgba(247, 144, 9, 0.16)',
    tagline: 'High-street trade-in voucher price',
    quoteRole: 'WeBuy cash / voucher',
    query: (device) => `site:in.webuy.com ${device} buy price`,
    snippet: (device, quote) =>
      `${device} — WeBuy around ₹${quote.toLocaleString('en-IN')} · voucher usually higher than cash`,
    about:
      'CeX (Computer Exchange) publishes store buy prices for working devices. Indian branches follow the same WeBuy grade bands used in the UK catalogue.',
    coverage: 'CeX India stores + in.webuy.com catalogue',
    freshness: 'Catalogue tick ~ every 4–8 hours',
    method: 'Working / below-working grade buy prices',
  },
  {
    id: 'flipkart',
    name: 'Flipkart',
    domain: 'flipkart.com',
    url: 'https://www.flipkart.com',
    mark: 'Fk',
    accent: '#2A55E5',
    accentSoft: 'rgba(42, 85, 229, 0.16)',
    tagline: 'Exchange value on a new-phone checkout',
    quoteRole: 'Exchange bonus',
    query: (device) => `site:flipkart.com exchange offer ${device}`,
    snippet: (device, quote) =>
      `${device} exchange up to ₹${quote.toLocaleString('en-IN')} · bonus tied to selected new SKU`,
    about:
      'Flipkart exchange quotes appear at checkout when buying a new phone. The headline “up to” value is a marketing ceiling; the paid exchange is confirmed after store or doorstep inspection.',
    coverage: 'Flipkart exchange · nationwide',
    freshness: 'Offer tiles rotate with ongoing sales',
    method: 'Exchange-up-to value for the same family / storage',
  },
];

export function roundToHundred(n: number): number {
  return Math.max(100, Math.round(n / 100) * 100);
}

/** Demo spreads around the Dobara reference offer — not a live scrape. */
export function quotesForEstimate(estimate: number): Record<TMarketSourceId, number> {
  return {
    cashify: roundToHundred(estimate * 1.05),
    cex: roundToHundred(estimate * 0.96),
    flipkart: roundToHundred(estimate * 1.02),
  };
}
