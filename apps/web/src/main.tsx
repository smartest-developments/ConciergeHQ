import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import './styles.css';

if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
  const vitalMetricNames = new Set(['first-contentful-paint', 'largest-contentful-paint', 'layout-shift']);

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!vitalMetricNames.has(entry.name)) {
        continue;
      }

      const value = entry.name === 'layout-shift' ? (entry as PerformanceEntry & { value?: number }).value : entry.startTime;
      window.console.info('[telemetry:web-vitals]', {
        metric: entry.name,
        value: typeof value === 'number' ? Number(value.toFixed(2)) : null
      });
    }
  });

  observer.observe({ type: 'paint', buffered: true });
  observer.observe({ type: 'largest-contentful-paint', buffered: true });
  observer.observe({ type: 'layout-shift', buffered: true });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
