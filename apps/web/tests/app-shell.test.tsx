import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppShell } from '../src/components/AppShell';

describe('AppShell', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
        removeItem: (key: string) => {
          store.delete(key);
        }
      }
    });
    window.localStorage.setItem('acq_auth_session', JSON.stringify({ email: 'operator@example.com', role: 'OPERATOR' }));
  });

  it('renders the product title', () => {
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>
    );

    expect(screen.getByText('Acquisition Concierge')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Operator Queue' }).getAttribute('href')).toBe('/operator/queue');
    expect(screen.getByRole('link', { name: 'Sign In' }).getAttribute('href')).toBe('/auth/login');
    expect(screen.getByText(/operator@example\.com/)).toBeTruthy();
  });
});
