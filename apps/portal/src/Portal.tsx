import React from 'react';

const apps = [
  { name: 'Consumer App', desc: 'Marketplace · Buy & sell phones · Recycle · Orders', url: '/consumer', color: '#0d6b4e', emoji: '🛍️' },
  { name: 'Store Tablet', desc: 'OTP verification · Device inspection · Photo capture · Reports', url: '/tablet', color: '#3b82f6', emoji: '📱' },
  { name: 'Management', desc: 'Store owner · Warehouse · Finance settlement', url: '/management', color: '#e8793e', emoji: '⚙️' },
  { name: 'Operations Admin', desc: 'Review · Pricing · Category · Role-based access', url: '/ops', color: '#8b5cf6', emoji: '🖥️' },
];

export const Portal: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif",
      background: 'linear-gradient(180deg, #f9f7f4 0%, #f3f0ec 100%)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <header style={{ padding: '80px 24px 48px', textAlign: 'center' }}>
        <h1 style={{
          fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
          color: '#0d6b4e', margin: '0 0 12px', fontWeight: 400, letterSpacing: '-0.03em',
        }}>
          Dobara
        </h1>
        <p style={{ fontSize: '1.0625rem', color: '#6b706c', margin: 0, lineHeight: 1.6 }}>
          Pre-owned phone platform — Interactive prototype
        </p>
      </header>

      {/* Grid */}
      <main style={{ maxWidth: 880, margin: '0 auto', padding: '0 24px 64px', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16 }}>
          {apps.map((app) => (
            <a
              key={app.url}
              href={app.url}
              style={{
                background: '#fff', borderRadius: 14, padding: '28px 26px',
                boxShadow: '0 2px 8px -2px rgba(0,0,0,0.06), 0 1px 3px -1px rgba(0,0,0,0.04)',
                border: '1px solid #e8e2da', textDecoration: 'none', color: 'inherit',
                transition: 'all 0.3s cubic-bezier(0.19,1,0.22,1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 12px 32px -4px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)';
                e.currentTarget.style.borderColor = app.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px -2px rgba(0,0,0,0.06), 0 1px 3px -1px rgba(0,0,0,0.04)';
                e.currentTarget.style.borderColor = '#e8e2da';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: `${app.color}12`, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0,
                }}>
                  {app.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '1.25rem', color: '#1a1d1b', margin: '0 0 6px', fontWeight: 400 }}>
                    {app.name}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#939994', margin: 0, lineHeight: 1.5 }}>
                    {app.desc}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ marginTop: 'auto', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '0.8125rem', color: '#b8bfb9', margin: 0 }}>
          All services running — <code style={{ background: '#f3f0ec', padding: '2px 8px', borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem' }}>pnpm dev</code>
        </p>
      </footer>
    </div>
  );
};
