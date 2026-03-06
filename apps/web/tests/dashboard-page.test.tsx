import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardPage } from '../src/pages/DashboardPage';
import { fetchRequests } from '../src/api';

vi.mock('../src/api', () => ({
  fetchRequests: vi.fn()
}));

const mockedFetchRequests = vi.mocked(fetchRequests);

describe('DashboardPage', () => {
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
        },
        clear: () => {
          store.clear();
        }
      }
    });
    mockedFetchRequests.mockReset();
    window.localStorage.setItem(
      'acq_auth_session',
      JSON.stringify({ email: 'buyer@example.com', role: 'CUSTOMER' })
    );
  });

  it('shows retry guidance for unpaid requests', async () => {
    mockedFetchRequests.mockResolvedValue({
      requests: [
        {
          id: 42,
          status: 'FEE_PENDING',
          userEmail: 'buyer@example.com',
          budgetChf: 1800,
          sourcingFeeChf: 180,
          category: 'SPORTS_EQUIPMENT',
          country: 'CH',
          condition: 'USED',
          urgency: 'FAST',
          createdAt: '2026-02-26T08:00:00.000Z',
          feePaidAt: null,
          proposal: null
        }
      ]
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Awaiting fee payment.')).toBeTruthy();
    });

    expect(screen.getByRole('link', { name: 'Retry payment checkout' }).getAttribute('href')).toBe(
      '/payment/42?fee=180'
    );
    expect(mockedFetchRequests).toHaveBeenCalledWith();
  });

  it('renders persisted payment cancellation notice once', async () => {
    mockedFetchRequests.mockResolvedValue({ requests: [] });
    window.localStorage.setItem('acq_payment_notice', JSON.stringify({ type: 'cancelled', requestId: 42 }));

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText('Payment checkout was cancelled for request #42. You can retry below.')
      ).toBeTruthy();
    });

    expect(window.localStorage.getItem('acq_payment_notice')).toBeNull();
  });
});
