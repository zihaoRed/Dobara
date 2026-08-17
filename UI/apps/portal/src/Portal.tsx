import React from 'react';

const apps = [
  { name: 'Consumer App', desc: 'Home · Buy · Sell · Account — marketplace prototype', url: '/consumer', color: '#064439' },
  { name: 'Store Tablet', desc: 'OTP verification · Device inspection · Photo capture · Reports', url: '/tablet', color: '#0a7a52' },
  { name: 'Management', desc: 'Admin · Store owner · Warehouse · Finance — unified internal app', url: '/management', color: '#c9a227' },
];

export const Portal: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      background: 'linear-gradient(180deg, #f5f6f5 0%, #eef0ee 100%)',
      display: 'flex', flexDirection: 'column',
    }}>
      <header style={{ padding: '80px 24px 48px', textAlign: 'center' }}>
        <h1 style={{
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
          color: '#064439', margin: '0 0 12px', fontWeight: 800, letterSpacing: '-0.03em',
        }}>
          Dobara
        </h1>
        <p style={{ fontSize: '1.0625rem', color: '#5c6863', margin: 0, lineHeight: 1.6 }}>
          Pre-owned phone platform — Interactive prototype
        </p>
      </header>

      <main style={{ maxWidth: 880, margin: '0 auto', padding: '0 24px 64px', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {apps.map((app) => (
            <a
              key={app.url}
              href={`${app.url}/`}
              onClick={(e) => {
                // Bust browser document cache when leaving portal for an app shell
                e.preventDefault();
                window.location.assign(`${app.url}/?_t=${Date.now()}`);
              }}
              style={{
                background: '#fff', borderRadius: 16, padding: '28px 26px',
                boxShadow: '0 2px 10px -2px rgba(6,68,57,0.06), 0 1px 3px -1px rgba(0,0,0,0.04)',
                border: '1px solid #dde3df', textDecoration: 'none', color: 'inherit',
                transition: 'all 0.3s cubic-bezier(0.19,1,0.22,1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 12px 32px -4px rgba(6,68,57,0.12), 0 0 0 1px rgba(0,0,0,0.04)';
                e.currentTarget.style.borderColor = app.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 10px -2px rgba(6,68,57,0.06), 0 1px 3px -1px rgba(0,0,0,0.04)';
                e.currentTarget.style.borderColor = '#dde3df';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: app.color, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  color: '#fff', fontWeight: 800, fontSize: 18,
                }}>
                  {app.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                    fontSize: '1.25rem', color: '#0f1a17', margin: '0 0 6px', fontWeight: 700,
                  }}>
                    {app.name}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#8a9590', margin: 0, lineHeight: 1.5 }}>
                    {app.desc}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </main>

      <footer style={{ marginTop: 'auto', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '0.8125rem', color: '#b0bab5', margin: 0 }}>Version MVP</p>
      </footer>
    </div>
  );
};
