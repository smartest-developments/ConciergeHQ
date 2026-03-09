import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

  it('tracks proposal-open funnel event when proposal link is clicked', async () => {
    const telemetrySpy = vi.spyOn(window.console, 'info').mockImplementation(() => undefined);

    mockedFetchRequests.mockResolvedValue({
      requests: [
        {
          id: 43,
          status: 'PROPOSAL_PUBLISHED',
          userEmail: 'buyer@example.com',
          budgetChf: 1400,
          sourcingFeeChf: 140,
          category: 'ELECTRONICS',
          country: 'CH',
          condition: 'NEW',
          urgency: 'STANDARD',
          createdAt: '2026-03-07T08:00:00.000Z',
          feePaidAt: '2026-03-07T08:10:00.000Z',
          proposal: {
            id: 1,
            merchantName: 'Swiss Gear',
            externalUrl: 'https://merchant.example/proposal',
            summary: null,
            publishedAt: '2026-03-07T10:00:00.000Z',
            expiresAt: '2026-03-07T12:00:00.000Z'
          }
        }
      ]
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    const proposalLink = await screen.findByRole('link', { name: 'Swiss Gear' });
    fireEvent.click(proposalLink);

    expect(telemetrySpy).toHaveBeenCalledWith('[telemetry:funnel]', {
      event: 'proposal_open',
      requestId: 43
    });

    telemetrySpy.mockRestore();
  });

  it('renders customer support severity routing entrypoint', async () => {
    mockedFetchRequests.mockResolvedValue({ requests: [] });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByRole('heading', { name: 'Support and escalation' }).length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText(/SEV-3:/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/SEV-2:/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/SEV-1:/).length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole('link', { name: 'support@acquisition-concierge.example' })[0]?.getAttribute('href')
    ).toBe('mailto:support@acquisition-concierge.example');
    expect(
      screen
        .getAllByRole('link', { name: 'legal-security@acquisition-concierge.example' })[0]
        ?.getAttribute('href')
    ).toBe('mailto:legal-security@acquisition-concierge.example');
  });
});
