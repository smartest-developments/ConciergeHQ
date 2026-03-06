import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchRequestDetail, transitionRequestStatus } from '../api';

type RequestDetailPayload = Awaited<ReturnType<typeof fetchRequestDetail>>;

export function OperatorRequestDetailPage() {
  const params = useParams<{ requestId: string }>();
  const requestId = Number(params.requestId);
  const [payload, setPayload] = useState<RequestDetailPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const reloadDetail = useCallback(() => {
    if (!Number.isInteger(requestId) || requestId <= 0) {
      setError('Invalid request id.');
      return;
    }

    return fetchRequestDetail(requestId)
      .then((response) => {
        setPayload(response);
        setError(null);
      })
      .catch(() => {
        setError('Could not load request detail.');
      });
  }, [requestId]);

  useEffect(() => {
    void reloadDetail();
  }, [requestId]);

  const transitionActionMap: Record<string, Array<{ label: string; toStatus: 'SOURCING' | 'COMPLETED' | 'CANCELED' }>> = {
    FEE_PAID: [
      { label: 'Move to sourcing', toStatus: 'SOURCING' },
      { label: 'Cancel request', toStatus: 'CANCELED' }
    ],
    SOURCING: [{ label: 'Cancel request', toStatus: 'CANCELED' }],
    PROPOSAL_PUBLISHED: [
      { label: 'Mark completed', toStatus: 'COMPLETED' },
      { label: 'Cancel request', toStatus: 'CANCELED' }
    ],
    PROPOSAL_EXPIRED: [{ label: 'Cancel request', toStatus: 'CANCELED' }]
  };

  const availableActions = payload ? transitionActionMap[payload.request.status] ?? [] : [];

  const onTransition = async (toStatus: 'SOURCING' | 'COMPLETED' | 'CANCELED') => {
    if (!payload) return;

    setIsTransitioning(true);
    try {
      await transitionRequestStatus(payload.request.id, { toStatus });
      await reloadDetail();
    } catch {
      setError('Could not transition request status.');
    } finally {
      setIsTransitioning(false);
    }
  };

  return (
    <section>
      <h2>Operator Request Detail</h2>
      <p>Review timeline, payment state, and proposal history before applying transitions.</p>
      <p>
        <Link to="/operator/queue">Back to queue</Link>
      </p>

      {error ? <p className="error">{error}</p> : null}

      {payload ? (
        <>
          <article className="card">
            <h3>Request #{payload.request.id}</h3>
            <p>
              <strong>Status:</strong> {payload.request.status}
            </p>
            <p>
              <strong>User:</strong> {payload.request.userEmail}
            </p>
            <p>
              <strong>Category:</strong> {payload.request.category} | <strong>Country:</strong>{' '}
              {payload.request.country}
            </p>
            <p>
              <strong>Budget:</strong> {payload.request.budgetChf} CHF | <strong>Fee:</strong>{' '}
              {payload.request.sourcingFeeChf} CHF
            </p>
            <p>
              <strong>Urgency:</strong> {payload.request.urgency} | <strong>Condition:</strong>{' '}
              {payload.request.condition}
            </p>
            <p>
              <strong>Fee paid at:</strong>{' '}
              {payload.request.feePaidAt ? new Date(payload.request.feePaidAt).toLocaleString() : 'Not paid yet'}
            </p>
            <p>
              <strong>Specs:</strong> {payload.request.specs}
            </p>
          </article>

          <article className="card">
            <h3>Status Timeline</h3>
            <ul>
              {payload.statusTimeline.map((event) => (
                <li key={event.id}>
                  {event.fromStatus ?? 'START'} {'->'} {event.toStatus} (
                  {new Date(event.occurredAt).toLocaleString()})
                  {event.reason ? ` - ${event.reason}` : ''}
                </li>
              ))}
              {payload.statusTimeline.length === 0 ? <li>No status events logged yet.</li> : null}
            </ul>
          </article>

          <article className="card">
            <h3>Transition Actions</h3>
            {availableActions.length === 0 ? (
              <p>No manual transition actions available for the current state.</p>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {availableActions.map((action) => (
                  <button
                    key={action.toStatus}
                    type="button"
                    onClick={() => void onTransition(action.toStatus)}
                    disabled={isTransitioning}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </article>

          <article className="card">
            <h3>Proposal History</h3>
            <ul>
              {payload.proposals.map((proposal) => (
                <li key={proposal.id}>
                  <strong>{proposal.merchantName}</strong> (
                  <a href={proposal.externalUrl} target="_blank" rel="noreferrer">
                    Open
                  </a>
                  ) - published {new Date(proposal.publishedAt).toLocaleString()}, expires{' '}
                  {new Date(proposal.expiresAt).toLocaleString()}
                  {proposal.summary ? ` - ${proposal.summary}` : ''}
                </li>
              ))}
              {payload.proposals.length === 0 ? <li>No proposals published yet.</li> : null}
            </ul>
          </article>
        </>
      ) : null}
    </section>
  );
}
