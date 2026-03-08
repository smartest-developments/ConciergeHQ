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

  it('renders shell navigation and legal links', () => {
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>
    );

    expect(screen.getByText('Acquisition Concierge')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Skip to main content' }).getAttribute('href')).toBe('#main-content');
    expect(screen.getByRole('link', { name: 'Operator Queue' }).getAttribute('href')).toBe('/operator/queue');
    expect(screen.getByRole('link', { name: 'Sign In' }).getAttribute('href')).toBe('/auth/login');
    expect(screen.getByRole('link', { name: 'Create Account' }).getAttribute('href')).toBe('/auth/register');
    expect(screen.getByRole('link', { name: 'Privacy Policy' }).getAttribute('href')).toBe('/legal#legal-privacy');
    expect(screen.getByRole('link', { name: 'Terms of Service' }).getAttribute('href')).toBe('/legal#legal-terms');
    expect(screen.getByText(/operator@example\.com/)).toBeTruthy();
  });
});
