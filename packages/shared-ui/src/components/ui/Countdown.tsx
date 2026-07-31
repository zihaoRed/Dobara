import React, { useEffect, useState } from 'react';

interface CountdownProps {
  seconds: number;
  onExpire?: () => void;
  size?: 'sm' | 'md';
  className?: string;
}

export const Countdown: React.FC<CountdownProps> = ({
  seconds,
  onExpire,
  size = 'md',
  className = '',
}) => {
  const [remaining, setRemaining] = useState(seconds);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (remaining <= 0) {
      setExpired(true);
      onExpire?.();
      return;
    }
    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setExpired(true);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');

  const textSize = size === 'sm' ? 'text-caption' : 'text-body';

  if (expired) {
    return (
      <span className={`${textSize} text-dobara-error font-semibold ${className}`}>
        Expired
      </span>
    );
  }

  const isWarning = remaining < 60;

  return (
    <span
      className={`${textSize} font-mono font-semibold ${
        isWarning ? 'text-dobara-warning animate-pulse' : 'text-text-secondary'
      } ${className}`}
    >
      {pad(mins)}:{pad(secs)}
    </span>
  );
};
