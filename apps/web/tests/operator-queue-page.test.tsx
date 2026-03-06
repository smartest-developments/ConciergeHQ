import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorQueuePage } from '../src/pages/OperatorQueuePage';
import { fetchRequests } from '../src/api';

vi.mock('../src/api', () => ({
  fetchRequests: vi.fn()
}));

const mockedFetchRequests = vi.mocked(fetchRequests);

function LocationSearchProbe() {
  const location = useLocation();
  return <output data-testid="location-search">{location.search}</output>;
}

function renderQueuePage(initialPath = '/operator/queue') {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <OperatorQueuePage />
      <LocationSearchProbe />
    </MemoryRouter>
  );
}

describe('OperatorQueuePage', () => {
  beforeEach(() => {
    cleanup();
    mockedFetchRequests.mockReset();
  });

  it('applies API-backed filters including date range', async () => {
    mockedFetchRequests
      .mockResolvedValueOnce({
        requests: [
          {
            id: 11,
            status: 'FEE_PENDING',
            userEmail: 'a@example.com',
            budgetChf: 1500,
            sourcingFeeChf: 150,
            category: 'ELECTRONICS',
            country: 'CH',
            condition: 'NEW',
            urgency: 'STANDARD',
            createdAt: '2026-03-01T10:00:00.000Z',
            feePaidAt: null,
            proposal: null
          }
        ],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 1,
          totalPages: 1
        }
      })
      .mockResolvedValueOnce({
        requests: [],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 0,
          totalPages: 1
        }
      });

    renderQueuePage();

    await waitFor(() => {
      expect(screen.getByText('Visible requests: 1 (total matching: 1)')).toBeTruthy();
    });
    expect(screen.getByRole('link', { name: 'Open detail' }).getAttribute('href')).toBe('/operator/requests/11');

    fireEvent.change(screen.getByLabelText('Status'), {
      target: { value: 'FEE_PENDING' }
    });
    fireEvent.change(screen.getByLabelText('Date from'), {
      target: { value: '2026-03-01' }
    });
    fireEvent.change(screen.getByLabelText('Date to'), {
      target: { value: '2026-03-05' }
    });
    fireEvent.change(screen.getByLabelText('Sort by'), {
      target: { value: 'budgetChf' }
    });
    fireEvent.change(screen.getByLabelText('Direction'), {
      target: { value: 'asc' }
    });

    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));

    await waitFor(() => {
      expect(mockedFetchRequests).toHaveBeenLastCalledWith({
        status: 'FEE_PENDING',
        category: undefined,
        country: undefined,
        dateFrom: '2026-03-01T00:00:00.000Z',
        dateTo: '2026-03-05T23:59:59.999Z',
        sortBy: 'budgetChf',
        sortDir: 'asc',
        page: 1,
        pageSize: 20
      });
    });

    expect(screen.getByText('No requests match the selected filters.')).toBeTruthy();
    await waitFor(() => {
      const search = screen.getByTestId('location-search').textContent ?? '';
      expect(search).toContain('status=FEE_PENDING');
      expect(search).toContain('dateFrom=2026-03-01');
      expect(search).toContain('dateTo=2026-03-05');
      expect(search).toContain('sortBy=budgetChf');
      expect(search).toContain('sortDir=asc');
    });
  });

  it('loads next page through API pagination', async () => {
    mockedFetchRequests
      .mockResolvedValueOnce({
        requests: [
          {
            id: 11,
            status: 'FEE_PENDING',
            userEmail: 'a@example.com',
            budgetChf: 1500,
            sourcingFeeChf: 150,
            category: 'ELECTRONICS',
            country: 'CH',
            condition: 'NEW',
            urgency: 'STANDARD',
            createdAt: '2026-03-01T10:00:00.000Z',
            feePaidAt: null,
            proposal: null
          }
        ],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 30,
          totalPages: 2
        }
      })
      .mockResolvedValueOnce({
        requests: [
          {
            id: 12,
            status: 'FEE_PAID',
            userEmail: 'b@example.com',
            budgetChf: 900,
            sourcingFeeChf: 90,
            category: 'SPORTS_EQUIPMENT',
            country: 'DE',
            condition: 'USED',
            urgency: 'FAST',
            createdAt: '2026-03-02T10:00:00.000Z',
            feePaidAt: '2026-03-02T10:03:00.000Z',
            proposal: null
          }
        ],
        pagination: {
          page: 2,
          pageSize: 20,
          total: 30,
          totalPages: 2
        }
      });

    renderQueuePage();

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 2')).toBeTruthy();
    });

    const nextButton = screen
      .getAllByRole('button', { name: 'Next' })
      .find((button) => !button.hasAttribute('disabled'));
    expect(nextButton).toBeTruthy();
    fireEvent.click(nextButton!);

    await waitFor(() => {
      expect(mockedFetchRequests).toHaveBeenLastCalledWith({
        status: undefined,
        category: undefined,
        country: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        sortBy: 'createdAt',
        sortDir: 'desc',
        page: 2,
        pageSize: 20
      });
    });

    expect(screen.getByText('Page 2 of 2')).toBeTruthy();
    expect(screen.getByText('b@example.com')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Open detail' }).getAttribute('href')).toBe('/operator/requests/12');
    await waitFor(() => {
      expect(screen.getByTestId('location-search').textContent).toContain('page=2');
    });
  });
});
