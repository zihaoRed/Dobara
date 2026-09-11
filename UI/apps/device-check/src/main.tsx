import React from 'react';
import { createRoot } from 'react-dom/client';
import DeviceCheck from './DeviceCheck';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DeviceCheck />
  </React.StrictMode>,
);
