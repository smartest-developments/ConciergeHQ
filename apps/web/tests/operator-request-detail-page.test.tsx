import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorRequestDetailPage } from '../src/pages/OperatorRequestDetailPage';
import { fetchRequestDetail } from '../src/api';

vi.mock('../src/api', () => ({
  fetchRequestDetail: vi.fn()
}));

const mockedFetchRequestDetail = vi.mocked(fetchRequestDetail);

function renderPage(path = '/operator/requests/55') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/operator/requests/:requestId" element={<OperatorRequestDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('OperatorRequestDetailPage', () => {
  beforeEach(() => {
    cleanup();
    mockedFetchRequestDetail.mockReset();
  });

  it('renders request summary, timeline, and proposal history', async () => {
    mockedFetchRequestDetail.mockResolvedValue({
      request: {
        id: 55,
        userEmail: 'detail@example.com',
        budgetChf: 1800,
        sourcingFeeChf: 180,
        specs: 'Need a low-mileage hatchback with service history.',
        category: 'ELECTRONICS',
        country: 'CH',
        condition: 'USED',
        urgency: 'FAST',
        status: 'PROPOSAL_PUBLISHED',
        feePaidAt: '2026-03-06T08:00:00.000Z',
        createdAt: '2026-03-05T08:00:00.000Z',
        updatedAt: '2026-03-06T08:05:00.000Z'
      },
      proposals: [
        {
          id: 9,
          merchantName: 'Prime Mobility',
          externalUrl: 'https://merchant.example/p/9',
          summary: 'Well-maintained import offer.',
          publishedAt: '2026-03-06T08:05:00.000Z',
          expiresAt: '2026-03-06T10:05:00.000Z',
          actedAt: null
        }
      ],
      statusTimeline: [
        {
          id: 4,
          fromStatus: 'SOURCING',
          toStatus: 'PROPOSAL_PUBLISHED',
          reason: 'Proposal published by operator',
          metadata: { proposalId: 9 },
          occurredAt: '2026-03-06T08:05:00.000Z'
        }
      ]
    });

    renderPage();

    await waitFor(() => {
      expect(mockedFetchRequestDetail).toHaveBeenCalledWith(55);
    });
    expect(screen.getByText('Request #55')).toBeTruthy();
    expect(screen.getByText('detail@example.com')).toBeTruthy();
    expect(screen.getByText(/SOURCING -> PROPOSAL_PUBLISHED/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Open' }).getAttribute('href')).toBe(
      'https://merchant.example/p/9'
    );
  });

  it('shows invalid-id error when route param is not numeric', async () => {
    renderPage('/operator/requests/abc');

    expect(screen.getByText('Invalid request id.')).toBeTruthy();
    expect(mockedFetchRequestDetail).not.toHaveBeenCalled();
  });
});
