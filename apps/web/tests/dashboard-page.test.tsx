import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardPage } from '../src/pages/DashboardPage';

const { fetchRequestsMock } = vi.hoisted(() => ({
  fetchRequestsMock: vi.fn()
}));

vi.mock('../src/api', () => ({
  fetchRequests: fetchRequestsMock
}));

describe('DashboardPage payment notices', () => {
  beforeEach(() => {
    const storage = new Map<string, string>();
    const localStorageMock = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      }
    };

    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      configurable: true
    });

    fetchRequestsMock.mockResolvedValue({ requests: [] });
  });

  it('renders cancelled checkout notice from persisted payment state', async () => {
    localStorage.setItem('acq_payment_notice', JSON.stringify({ type: 'cancelled', requestId: 42 }));

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Payment checkout was cancelled for request #42/i)).toBeTruthy();
    expect(localStorage.getItem('acq_payment_notice')).toBeNull();
  });

  it('renders failed payment notice from persisted payment state', async () => {
    localStorage.setItem('acq_payment_notice', JSON.stringify({ type: 'failed', requestId: 99 }));

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Payment failed for request #99/i)).toBeTruthy();
    expect(localStorage.getItem('acq_payment_notice')).toBeNull();
  });
});
