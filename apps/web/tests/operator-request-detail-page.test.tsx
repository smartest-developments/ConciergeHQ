import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorRequestDetailPage } from '../src/pages/OperatorRequestDetailPage';
import { fetchRequestDetail, publishProposal, transitionRequestStatus } from '../src/api';

vi.mock('../src/api', () => ({
  fetchRequestDetail: vi.fn(),
  publishProposal: vi.fn(),
  transitionRequestStatus: vi.fn()
}));

const mockedFetchRequestDetail = vi.mocked(fetchRequestDetail);
const mockedPublishProposal = vi.mocked(publishProposal);
const mockedTransitionRequestStatus = vi.mocked(transitionRequestStatus);

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
    mockedPublishProposal.mockReset();
    mockedTransitionRequestStatus.mockReset();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
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
    expect(screen.getByRole('link', { name: 'Open' }).getAttribute('href')).toBe('https://merchant.example/p/9');
    expect(screen.getByRole('button', { name: 'Mark completed' })).toBeTruthy();
  });

  it('submits confirmed transition action with reason and refreshes request detail', async () => {
    mockedFetchRequestDetail
      .mockResolvedValueOnce({
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
          status: 'FEE_PAID',
          feePaidAt: '2026-03-06T08:00:00.000Z',
          createdAt: '2026-03-05T08:00:00.000Z',
          updatedAt: '2026-03-06T08:05:00.000Z'
        },
        proposals: [],
        statusTimeline: []
      })
      .mockResolvedValueOnce({
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
          status: 'SOURCING',
          feePaidAt: '2026-03-06T08:00:00.000Z',
          createdAt: '2026-03-05T08:00:00.000Z',
          updatedAt: '2026-03-06T08:15:00.000Z'
        },
        proposals: [],
        statusTimeline: [
          {
            id: 5,
            fromStatus: 'FEE_PAID',
            toStatus: 'SOURCING',
            reason: 'Operator moved request into active sourcing',
            metadata: null,
            occurredAt: '2026-03-06T08:15:00.000Z'
          }
        ]
      });
    mockedTransitionRequestStatus.mockResolvedValue({
      id: 55,
      status: 'SOURCING',
      updatedAt: '2026-03-06T08:15:00.000Z'
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Start sourcing' })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Start sourcing' }));
    fireEvent.change(screen.getByLabelText('Reason (optional)'), {
      target: { value: 'Operator accepted payment and started sourcing.' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm transition' }));

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('Confirm transition to SOURCING with this reason?');
      expect(mockedTransitionRequestStatus).toHaveBeenCalledWith(55, {
        toStatus: 'SOURCING',
        reason: 'Operator accepted payment and started sourcing.'
      });
      expect(mockedFetchRequestDetail).toHaveBeenCalledTimes(2);
    });
    expect(screen.getByText('Request moved to SOURCING.')).toBeTruthy();
  });

  it('shows invalid-id error when route param is not numeric', async () => {
    renderPage('/operator/requests/abc');

    expect(screen.getByText('Invalid request id.')).toBeTruthy();
    expect(mockedFetchRequestDetail).not.toHaveBeenCalled();
  });

  it('publishes a proposal and refreshes detail when request is sourcing', async () => {
    mockedFetchRequestDetail
      .mockResolvedValueOnce({
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
          status: 'SOURCING',
          feePaidAt: '2026-03-06T08:00:00.000Z',
          createdAt: '2026-03-05T08:00:00.000Z',
          updatedAt: '2026-03-06T08:05:00.000Z'
        },
        proposals: [],
        statusTimeline: []
      })
      .mockResolvedValueOnce({
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
          updatedAt: '2026-03-06T08:15:00.000Z'
        },
        proposals: [
          {
            id: 10,
            merchantName: 'Prime Mobility',
            externalUrl: 'https://merchant.example/p/10',
            summary: 'Fresh sourcing result',
            publishedAt: '2026-03-06T08:15:00.000Z',
            expiresAt: '2026-03-06T10:15:00.000Z',
            actedAt: null
          }
        ],
        statusTimeline: []
      });
    mockedPublishProposal.mockResolvedValue({
      requestId: 55,
      status: 'PROPOSAL_PUBLISHED',
      proposal: {
        id: 10,
        merchantName: 'Prime Mobility',
        externalUrl: 'https://merchant.example/p/10',
        summary: 'Fresh sourcing result',
        publishedAt: '2026-03-06T08:15:00.000Z',
        expiresAt: '2026-03-06T10:15:00.000Z'
      }
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Publish proposal' })).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText('Merchant name'), { target: { value: 'Prime Mobility' } });
    fireEvent.change(screen.getByLabelText('Proposal URL'), {
      target: { value: 'https://merchant.example/p/10' }
    });
    fireEvent.change(screen.getByLabelText('Summary (optional)'), {
      target: { value: 'Fresh sourcing result' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Publish proposal' }));

    await waitFor(() => {
      expect(mockedPublishProposal).toHaveBeenCalledWith(55, {
        merchantName: 'Prime Mobility',
        externalUrl: 'https://merchant.example/p/10',
        summary: 'Fresh sourcing result'
      });
      expect(mockedFetchRequestDetail).toHaveBeenCalledTimes(2);
    });
    expect(screen.getByText('Proposal published and timeline refreshed.')).toBeTruthy();
  });
});
