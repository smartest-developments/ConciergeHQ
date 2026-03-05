import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorQueuePage } from '../src/pages/OperatorQueuePage';
import { fetchRequests } from '../src/api';

vi.mock('../src/api', () => ({
  fetchRequests: vi.fn()
}));

const mockedFetchRequests = vi.mocked(fetchRequests);

describe('OperatorQueuePage', () => {
  beforeEach(() => {
    mockedFetchRequests.mockReset();
  });

  it('filters queue records by status', async () => {
    mockedFetchRequests.mockResolvedValue({
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
        },
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
      ]
    });

    render(
      <MemoryRouter>
        <OperatorQueuePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Visible requests: 2')).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText('Status'), {
      target: { value: 'FEE_PENDING' }
    });

    expect(screen.getByText('Visible requests: 1')).toBeTruthy();
    expect(screen.getByText('a@example.com')).toBeTruthy();
    expect(screen.queryByText('b@example.com')).toBeNull();
  });
});
