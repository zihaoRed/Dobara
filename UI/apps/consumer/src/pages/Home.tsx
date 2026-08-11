import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchBar, DeviceCard, Button } from '@dobara/ui';
import {
  Bell, ShoppingBag, Check, Star, ChevronRight,
  ShoppingCart, ArrowLeftRight,
  Zap, Gift, GraduationCap, Users, Shield, RotateCcw,
  Truck, BadgeCheck, Bot, Mail, Gem, Wallet, Sparkles, Smartphone,
} from 'lucide-react';

const SERVICES = [
  { key: 'buy', title: 'Buy', desc: 'Certified phones', icon: ShoppingCart, bg: 'bg-primary-500', to: '/buy' },
  { key: 'exchange', title: 'Exchange', desc: 'Upgrade now', icon: ArrowLeftRight, bg: 'bg-sky-600', to: '/sell' },
];

const STATS = [
  { label: 'Customer Rating', value: '4.9/5', icon: Star },
  { label: 'Happy Customers', value: '100k+', icon: Users },
  { label: 'Partner Stores', value: '1k+', icon: BadgeCheck },
  { label: 'Devices Processed', value: '500k+', icon: Shield },
];

const BRANDS = ['Apple', 'Samsung', 'Xiaomi', 'OnePlus', 'OPPO', 'Vivo', 'Google', 'Nothing'];

const DEALS = [
  { imei: '350000000000001', brand: 'Apple', model: 'iPhone 13', grade: 'A' as const, price: 42000, originalPrice: 49900, storage: '128GB', city: 'Mumbai' },
  { imei: '350000000000004', brand: 'Apple', model: 'iPhone 14', grade: 'A' as const, price: 55000, originalPrice: 69900, storage: '128GB', city: 'Mumbai' },
  { imei: '350000000000007', brand: 'Samsung', model: 'Galaxy S22', grade: 'A' as const, price: 40000, originalPrice: 52000, storage: '128GB', city: 'Delhi' },
  { imei: '350000000000010', brand: 'Xiaomi', model: 'Mi 11', grade: 'A' as const, price: 22000, originalPrice: 29900, storage: '256GB', city: 'Mumbai' },
];

const OFFERS = [
  { title: 'Flash Sale', desc: 'Up to 30% off', icon: Zap, color: 'bg-red-500' },
  { title: 'Exchange Bonus', desc: 'Extra ₹2,000', icon: Gift, color: 'bg-primary-500' },
  { title: 'Student Discount', desc: '10% off', icon: GraduationCap, color: 'bg-teal-600' },
  { title: 'Referral Rewards', desc: 'Earn ₹500', icon: Users, color: 'bg-accent-500' },
];

const CATEGORIES = [
  { title: 'Premium Phones', icon: Gem },
  { title: 'Value For Money', icon: Wallet },
  { title: 'Latest Models', icon: Sparkles },
  { title: 'Budget Picks', icon: Smartphone },
];

const TESTIMONIALS = [
  { name: 'Priya S.', text: 'Got a certified iPhone 13 at a great price. Quality was exactly as described!', rating: 5, device: 'iPhone 13' },
  { name: 'Rahul M.', text: 'Sold my old phone in 20 minutes at the store. Super smooth process.', rating: 5, device: 'Galaxy S21' },
  { name: 'Ananya K.', text: 'AI Advisor helped me pick the right phone for my budget. Love Dobara!', rating: 5, device: 'OnePlus Nord' },
];

const TRUST_ITEMS = [
  { icon: Shield, label: '100% Safe Payments' },
  { icon: RotateCcw, label: '7 Days Returns' },
  { icon: Truck, label: 'Free Delivery' },
  { icon: BadgeCheck, label: 'IMEI Verified' },
];

function PhoenixLogo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
      <circle cx="24" cy="24" r="22" fill="#064439" />
      <path
        d="M24 8c2 6 8 10 8 18-2-2-4-3-8-3s-6 1-8 3c0-8 6-12 8-18z"
        fill="#C9A227"
      />
      <path
        d="M14 28c4 2 6 6 10 10 4-4 6-8 10-10-4 1-7 2-10 2s-6-1-10-2z"
        fill="#D4AF37"
        opacity="0.85"
      />
      <circle cx="24" cy="22" r="3" fill="#F5F6F5" />
    </svg>
  );
}

function PhoneCluster() {
  return (
    <div className="relative h-36 flex items-end justify-center gap-2 mt-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`w-16 h-28 rounded-xl bg-gradient-to-b from-slate-200 to-slate-400 border-2 border-slate-300 shadow-lg ${
            i === 1 ? 'h-32 w-[72px] -mb-1 z-10 border-accent-500' : i === 0 ? '-rotate-6' : 'rotate-6'
          }`}
          style={{ background: i === 1 ? 'linear-gradient(160deg,#1a1a2e,#16213e)' : undefined }}
        >
          <div className="m-1.5 h-full rounded-lg bg-gradient-to-br from-slate-700/40 to-slate-900/60" />
        </div>
      ))}
    </div>
  );
}

export function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [email, setEmail] = useState('');

  const handleSearch = () => {
    if (search.trim()) navigate(`/buy?q=${encodeURIComponent(search.trim())}`);
    else navigate('/buy');
  };

  return (
    <div className="max-w-lg mx-auto pb-4">
      {/* Top bar */}
      <header className="flex items-center justify-between pt-1 pb-2">
        <a
          href="/"
          className="flex items-center gap-2 no-underline hover:opacity-80 transition-opacity"
          aria-label="Back to Dobara module selection"
          title="Back to module selection"
        >
          <PhoenixLogo className="w-8 h-8" />
          <span className="text-lg font-extrabold tracking-tight text-primary-500">Dobara</span>
        </a>
        <div className="flex items-center gap-1">
          <button type="button" className="relative p-2 rounded-full hover:bg-surface-high" aria-label="Notifications">
            <Bell size={22} className="text-text-primary" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <button
            type="button"
            className="p-2 rounded-full hover:bg-surface-high"
            aria-label="Cart"
            onClick={() => navigate('/buy')}
          >
            <ShoppingBag size={22} className="text-text-primary" />
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white px-5 pt-6 pb-5 overflow-hidden relative">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_80%_20%,#C9A227,transparent_50%)]" />
        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <PhoenixLogo className="w-10 h-10" />
            <span className="text-2xl font-extrabold tracking-tight">Dobara</span>
          </div>
          <p className="text-sm text-white/85 font-medium max-w-xs mx-auto leading-relaxed">
            India's trusted marketplace for certified pre-owned phones
          </p>
          <PhoneCluster />
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {['AI Powered', 'IMEI Verified', 'Certified & Secure'].map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 text-[11px] font-semibold backdrop-blur-sm"
              >
                <Check size={12} className="text-accent-100" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Search */}
      <div className="mt-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search phones, brands..."
          showExtras
          onCameraClick={() => navigate('/buy')}
          onMicClick={() => navigate('/buy')}
        />
        {search && (
          <button
            type="button"
            onClick={handleSearch}
            className="mt-2 w-full text-center text-caption font-semibold text-primary-500"
          >
            Search for “{search}”
          </button>
        )}
      </div>

      {/* Service grid */}
      <section className="mt-5 grid grid-cols-2 gap-3">
        {SERVICES.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => navigate(s.to)}
              className={`${s.bg} text-white rounded-2xl p-4 text-left shadow-card hover:shadow-card-hover transition-shadow relative overflow-hidden`}
            >
              <Icon size={28} className="mb-3 opacity-90" />
              <p className="font-bold text-lg leading-none">{s.title}</p>
              <p className="text-xs text-white/75 mt-1">{s.desc}</p>
              <span className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <ChevronRight size={16} />
              </span>
            </button>
          );
        })}
      </section>

      {/* Trust stats */}
      <section className="mt-5 rounded-2xl bg-primary-500 text-white py-4 px-2">
        <div className="grid grid-cols-4 gap-1 max-w-lg mx-auto">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="text-center px-1">
                <Icon size={18} className="mx-auto mb-1 text-accent-100" strokeWidth={1.5} />
                <p className="text-sm font-bold leading-tight">{stat.value}</p>
                <p className="text-[9px] text-white/70 leading-tight mt-0.5">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Top Brands */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-h4 font-bold text-text-primary">Top Brands</h2>
          <button type="button" onClick={() => navigate('/buy')} className="text-caption font-semibold text-primary-500 flex items-center gap-0.5">
            View All <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
          {BRANDS.map((brand) => (
            <button
              key={brand}
              type="button"
              onClick={() => navigate('/buy')}
              className="flex-shrink-0 flex flex-col items-center gap-1.5"
            >
              <div className="w-14 h-14 rounded-full bg-white border border-border shadow-sm flex items-center justify-center">
                <span className="text-[10px] font-bold text-primary-500 text-center leading-tight px-1">{brand.slice(0, 2).toUpperCase()}</span>
              </div>
              <span className="text-[11px] text-text-muted font-medium">{brand}</span>
            </button>
          ))}
        </div>
      </section>

      {/* AI Advisor */}
      <section className="mt-5">
        <div className="rounded-2xl bg-gradient-to-r from-primary-500 to-primary-700 text-white p-5 flex gap-4 items-center shadow-card">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <Bot size={36} className="text-accent-100" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg">AI Phone Advisor</h3>
            <ul className="mt-1 space-y-0.5 text-xs text-white/80">
              <li className="flex items-center gap-1"><Check size={12} /> Budget-matched picks</li>
              <li className="flex items-center gap-1"><Check size={12} /> Condition explained</li>
              <li className="flex items-center gap-1"><Check size={12} /> Instant recommendations</li>
            </ul>
            <Button
              pill
              size="sm"
              className="mt-3 !bg-white !text-primary-500 hover:!bg-accent-50"
              onClick={() => navigate('/buy')}
            >
              Try AI Advisor →
            </Button>
          </div>
        </div>
      </section>

      {/* Today's Best Deals */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-h4 font-bold text-text-primary">Today's Best Deals</h2>
          <button type="button" onClick={() => navigate('/buy')} className="text-caption font-semibold text-primary-500 flex items-center gap-0.5">
            View All <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {DEALS.map((d) => (
            <DeviceCard
              key={d.imei}
              imei={d.imei}
              brand={d.brand}
              model={d.model}
              grade={d.grade}
              price={d.price}
              originalPrice={d.originalPrice}
              storage={d.storage}
              city={d.city}
              onClick={() => navigate(`/buy/product/${d.imei}`)}
            />
          ))}
        </div>
      </section>

      {/* Exciting Offers */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-h4 font-bold text-text-primary">Exciting Offers</h2>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {OFFERS.map((o) => {
            const Icon = o.icon;
            return (
              <button
                key={o.title}
                type="button"
                onClick={() => navigate('/buy')}
                className="flex flex-col items-center text-center gap-1.5"
              >
                <div className={`w-12 h-12 rounded-xl ${o.color} text-white flex items-center justify-center shadow-sm`}>
                  <Icon size={22} />
                </div>
                <p className="text-[11px] font-semibold text-text-primary leading-tight">{o.title}</p>
                <p className="text-[10px] text-text-muted leading-tight">{o.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Popular Categories */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-h4 font-bold text-text-primary">Popular Categories</h2>
          <button type="button" onClick={() => navigate('/buy')} className="text-caption font-semibold text-primary-500 flex items-center gap-0.5">
            View All <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.title}
                type="button"
                onClick={() => navigate('/buy')}
                className="flex-shrink-0 w-28 rounded-xl bg-white border border-border shadow-sm p-3 text-center hover:shadow-card transition-shadow"
              >
                <span className="w-10 h-10 mx-auto mb-2 rounded-xl bg-primary-50 text-primary-500 flex items-center justify-center">
                  <Icon size={20} />
                </span>
                <span className="text-[11px] font-semibold text-text-primary leading-tight">{c.title}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mt-6">
        <h2 className="text-h4 font-bold text-text-primary mb-3">What Customers Say</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="flex-shrink-0 w-64 rounded-xl bg-white border border-border shadow-card p-4"
            >
              <div className="flex gap-0.5 mb-2">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} size={14} className="fill-accent-500 text-accent-500" />
                ))}
              </div>
              <p className="text-caption text-text-secondary leading-relaxed mb-3">"{t.text}"</p>
              <div className="flex items-center justify-between">
                <p className="text-caption font-semibold text-text-primary">{t.name}</p>
                <p className="text-[10px] text-text-muted">{t.device}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust badges */}
      <section className="mt-6 grid grid-cols-4 gap-2">
        {TRUST_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="text-center">
              <Icon size={22} className="mx-auto text-primary-500 mb-1" strokeWidth={1.5} />
              <p className="text-[10px] text-text-muted font-medium leading-tight">{item.label}</p>
            </div>
          );
        })}
      </section>

      {/* Sell CTA */}
      <section className="mt-5">
        <div className="rounded-2xl bg-primary-500 text-white p-5 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-lg">Exchange Your Phone</h3>
            <p className="text-xs text-white/75 mt-0.5">Upgrade with trade-in bonus at partner stores</p>
          </div>
          <Button pill size="sm" className="!bg-white !text-primary-500 shrink-0" onClick={() => navigate('/sell')}>
            Exchange Now →
          </Button>
        </div>
      </section>

      {/* Newsletter */}
      <section className="mt-5">
        <div className="rounded-2xl bg-surface-low border border-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <Mail size={18} className="text-primary-500" />
            <h3 className="font-bold text-text-primary">Stay Updated</h3>
          </div>
          <p className="text-caption text-text-muted mb-3">Get deals & tips in your inbox</p>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              className="flex-1 h-10 px-3 rounded-full border border-border bg-white text-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Button pill size="md" onClick={() => setEmail('')}>
              Subscribe
            </Button>
          </div>
        </div>
      </section>

      {/* Footer trust ribbon */}
      <footer className="mt-6 mb-2 rounded-2xl bg-primary-500 text-white py-4 px-3">
        <div className="flex justify-around max-w-lg mx-auto">
          {['Certified Devices', 'Secure & Safe', 'AI Powered', 'Trusted Stores'].map((label) => (
            <div key={label} className="text-center px-1">
              <BadgeCheck size={18} className="mx-auto text-accent-500 mb-1" strokeWidth={1.5} />
              <p className="text-[9px] text-white/80 font-medium leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
