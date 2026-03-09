import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchRequestDetail, publishProposal, submitSupportTicket, transitionRequestStatus } from '../api';

type RequestDetailPayload = Awaited<ReturnType<typeof fetchRequestDetail>>;
type TransitionStatus = 'SOURCING' | 'COMPLETED' | 'CANCELED';

function getAllowedTransitions(status: string): TransitionStatus[] {
  const transitions: TransitionStatus[] = [];

  if (status === 'FEE_PAID') {
    transitions.push('SOURCING');
  }

  if (status === 'PROPOSAL_PUBLISHED') {
    transitions.push('COMPLETED');
  }

  if (status !== 'COMPLETED' && status !== 'CANCELED') {
    transitions.push('CANCELED');
  }

  return transitions;
}

function getActionLabel(status: TransitionStatus): string {
  if (status === 'SOURCING') return 'Start sourcing';
  if (status === 'COMPLETED') return 'Mark completed';
  return 'Cancel request';
}

function getTransitionReasonPlaceholder(status: TransitionStatus): string {
  if (status === 'SOURCING') return 'Why is this request moving into sourcing?';
  if (status === 'COMPLETED') return 'Why is this request now completed?';
  return 'Why is this request being canceled?';
}

function getProposalCountdownLabel(expiresAtIso: string, nowMs: number): string {
  const expiresAtMs = Date.parse(expiresAtIso);
  if (Number.isNaN(expiresAtMs)) {
    return 'Expiry unavailable';
  }

  const diffMs = expiresAtMs - nowMs;
  const diffMinutes = Math.floor(Math.abs(diffMs) / 60000);
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (diffMs <= 0) {
    if (hours > 0) {
      return `Expired ${hours}h ${String(minutes).padStart(2, '0')}m ago`;
    }
    return `Expired ${minutes}m ago`;
  }

  if (hours > 0) {
    return `Expires in ${hours}h ${String(minutes).padStart(2, '0')}m`;
  }

  return `Expires in ${Math.max(diffMinutes, 0)}m`;
}

function getAuditActionLabel(actionType: 'PROPOSAL_PUBLISHED' | 'STATUS_OVERRIDE' | 'ROLE_CHANGE'): string {
  if (actionType === 'PROPOSAL_PUBLISHED') {
    return 'Proposal published';
  }
  if (actionType === 'ROLE_CHANGE') {
    return 'Role changed';
  }

  return 'Status override';
}

export function OperatorRequestDetailPage() {
  const params = useParams<{ requestId: string }>();
  const requestId = Number(params.requestId);
  const [payload, setPayload] = useState<RequestDetailPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [pendingTransition, setPendingTransition] = useState<TransitionStatus | null>(null);
  const [transitionReason, setTransitionReason] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [merchantName, setMerchantName] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [proposalSummary, setProposalSummary] = useState('');
  const [isPublishingProposal, setIsPublishingProposal] = useState(false);
  const [proposalCountdownNow, setProposalCountdownNow] = useState(() => Date.now());
  const [supportSeverity, setSupportSeverity] = useState<'SEV-1' | 'SEV-2' | 'SEV-3'>('SEV-3');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportError, setSupportError] = useState<string | null>(null);
  const [supportSuccess, setSupportSuccess] = useState<string | null>(null);
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);

  const loadRequestDetail = async () => {
    const response = await fetchRequestDetail(requestId);
    setPayload(response);
    setError(null);
  };

  useEffect(() => {
    if (!Number.isInteger(requestId) || requestId <= 0) {
      setError('Invalid request id.');
      return;
    }

    loadRequestDetail().catch(() => {
      setError('Could not load request detail.');
    });
  }, [requestId]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setProposalCountdownNow(Date.now());
    }, 30000);

    return () => window.clearInterval(interval);
  }, []);

  const availableTransitions = useMemo(
    () => (payload ? getAllowedTransitions(payload.request.status) : []),
    [payload]
  );

  const startTransition = (toStatus: TransitionStatus) => {
    setPendingTransition(toStatus);
    setTransitionReason('');
    setActionError(null);
    setActionMessage(null);
  };

  const cancelPendingTransition = () => {
    setPendingTransition(null);
    setTransitionReason('');
  };

  const applyOptimisticTransition = (current: RequestDetailPayload, toStatus: TransitionStatus, reason?: string) => {
    const nowIso = new Date().toISOString();

    return {
      ...current,
      request: {
        ...current.request,
        status: toStatus,
        updatedAt: nowIso
      },
      proposals:
        toStatus === 'COMPLETED' || toStatus === 'CANCELED'
          ? current.proposals.map((proposal, index) =>
              index === 0 && proposal.actedAt === null ? { ...proposal, actedAt: nowIso } : proposal
            )
          : current.proposals,
      statusTimeline: [
        {
          id: -Date.now(),
          fromStatus: current.request.status,
          toStatus,
          reason: reason ?? null,
          metadata: { optimistic: true },
          occurredAt: nowIso
        },
        ...current.statusTimeline
      ]
    };
  };

  const handleTransitionConfirm = async () => {
    if (!pendingTransition) {
      return;
    }

    if (!payload) {
      return;
    }

    const normalizedReason = transitionReason.trim();
    const confirmationMessage =
      normalizedReason.length > 0
        ? `Confirm transition to ${pendingTransition} with this reason?`
        : `Confirm transition to ${pendingTransition}?`;
    if (!window.confirm(confirmationMessage)) {
      return;
    }

    setActionError(null);
    setActionMessage(null);
    setIsTransitioning(true);

    try {
      setPayload(applyOptimisticTransition(payload, pendingTransition, normalizedReason || undefined));
      setActionMessage('Applying transition and refreshing timeline...');
      await transitionRequestStatus(payload.request.id, {
        toStatus: pendingTransition,
        ...(normalizedReason ? { reason: normalizedReason } : {})
      });
      await loadRequestDetail();
      setActionMessage(`Request moved to ${pendingTransition}.`);
      setPendingTransition(null);
      setTransitionReason('');
    } catch {
      setActionError('Could not apply status transition.');
      await loadRequestDetail().catch(() => undefined);
    } finally {
      setIsTransitioning(false);
    }
  };

  const canPublishProposal = payload?.request.status === 'FEE_PAID' || payload?.request.status === 'SOURCING';
  const latestProposal = payload?.proposals[0] ?? null;
  const adminAuditTrail = payload?.adminAuditTrail ?? [];

  const handlePublishProposal = async () => {
    if (!payload || !canPublishProposal || isPublishingProposal) {
      return;
    }

    const normalizedMerchantName = merchantName.trim();
    const normalizedExternalUrl = externalUrl.trim();
    const normalizedSummary = proposalSummary.trim();

    if (!normalizedMerchantName || !normalizedExternalUrl) {
      setActionError('Merchant name and proposal URL are required.');
      return;
    }

    setActionError(null);
    setActionMessage(null);
    setIsPublishingProposal(true);

    try {
      await publishProposal(payload.request.id, {
        merchantName: normalizedMerchantName,
        externalUrl: normalizedExternalUrl,
        ...(normalizedSummary ? { summary: normalizedSummary } : {})
      });
      await loadRequestDetail();
      setActionMessage('Proposal published and timeline refreshed.');
      setMerchantName('');
      setExternalUrl('');
      setProposalSummary('');
    } catch (caughtError) {
      if (caughtError instanceof Error && caughtError.message === 'REQUEST_NOT_READY_FOR_PROPOSAL') {
        setActionError('Proposal cannot be published because this request is no longer fee-paid/sourcing.');
      } else {
        setActionError('Could not publish proposal.');
      }
      setActionMessage(null);
      await loadRequestDetail().catch(() => undefined);
    } finally {
      setIsPublishingProposal(false);
    }
  };

  const handleSupportSubmit = async () => {
    if (!payload || isSubmittingSupport) {
      return;
    }

    const normalizedMessage = supportMessage.trim();
    setSupportError(null);
    setSupportSuccess(null);

    if (normalizedMessage.length < 10 || normalizedMessage.length > 1000) {
      setSupportError('Support message must be between 10 and 1000 characters.');
      return;
    }

    setIsSubmittingSupport(true);

    try {
      await submitSupportTicket(payload.request.id, {
        severity: supportSeverity,
        source: 'OPERATOR_DETAIL',
        message: normalizedMessage
      });
      setSupportSuccess(`Support ticket submitted for request #${payload.request.id} (${supportSeverity}).`);
      setSupportMessage('');
    } catch (caughtError) {
      if (caughtError instanceof Error && caughtError.message === 'AUTH_REQUIRED') {
        setSupportError('Session expired. Sign in again and retry support ticket submission.');
      } else if (caughtError instanceof Error && caughtError.message === 'REQUEST_FORBIDDEN') {
        setSupportError('You are not authorized to submit support tickets for this request.');
      } else if (caughtError instanceof Error && caughtError.message === 'VALIDATION_ERROR') {
        setSupportError('Support ticket validation failed. Check severity and message details.');
      } else {
        setSupportError('Could not submit support ticket.');
      }
    } finally {
      setIsSubmittingSupport(false);
    }
  };

  return (
    <section>
      <h2>Operator Request Detail</h2>
      <p>Review timeline, payment state, and proposal history before applying transitions.</p>
      <p>
        <Link to="/operator/queue">Back to queue</Link>
      </p>
      <section className="card" aria-labelledby="operator-support-routing-title">
        <h3 id="operator-support-routing-title">Support routing hints</h3>
        <ul>
          <li>
            <strong>SEV-3:</strong> normal request question. Route to{' '}
            <a href="mailto:support@acquisition-concierge.example">support@acquisition-concierge.example</a>.
          </li>
          <li>
            <strong>SEV-2:</strong> request blocked by payment/report state mismatch. Route to{' '}
            <a href="mailto:ops-escalation@acquisition-concierge.example">
              ops-escalation@acquisition-concierge.example
            </a>
            .
          </li>
          <li>
            <strong>SEV-1:</strong> legal/security exposure or incorrect charge risk. Route to{' '}
            <a href="mailto:legal-security@acquisition-concierge.example">
              legal-security@acquisition-concierge.example
            </a>
            .
          </li>
        </ul>
        <div style={{ marginTop: 12 }}>
          <h4>Submit support ticket</h4>
          <label htmlFor="support-ticket-severity">Severity</label>
          <select
            id="support-ticket-severity"
            value={supportSeverity}
            onChange={(event) => setSupportSeverity(event.target.value as 'SEV-1' | 'SEV-2' | 'SEV-3')}
            style={{ display: 'block', marginTop: 4, marginBottom: 8 }}
          >
            <option value="SEV-3">SEV-3</option>
            <option value="SEV-2">SEV-2</option>
            <option value="SEV-1">SEV-1</option>
          </select>
          <label htmlFor="support-ticket-message">Message</label>
          <textarea
            id="support-ticket-message"
            value={supportMessage}
            onChange={(event) => setSupportMessage(event.target.value)}
            rows={3}
            style={{ display: 'block', width: '100%', marginTop: 4, marginBottom: 8 }}
          />
          <button type="button" onClick={() => void handleSupportSubmit()} disabled={isSubmittingSupport}>
            {isSubmittingSupport ? 'Submitting support ticket...' : 'Submit support ticket'}
          </button>
          {supportError ? <p className="error">{supportError}</p> : null}
          {supportSuccess ? <p>{supportSuccess}</p> : null}
        </div>
      </section>

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
            <h3>Transition Actions</h3>
            <p>Allowed actions depend on current request status.</p>
            {availableTransitions.length > 0 ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {availableTransitions.map((transitionStatus) => (
                  <button
                    key={transitionStatus}
                    type="button"
                    onClick={() => startTransition(transitionStatus)}
                    disabled={isTransitioning}
                  >
                    {getActionLabel(transitionStatus)}
                  </button>
                ))}
              </div>
            ) : (
              <p>No transition actions available.</p>
            )}
            {pendingTransition ? (
              <div style={{ marginTop: 12 }}>
                <p>
                  <strong>Confirm action:</strong> {getActionLabel(pendingTransition)}
                </p>
                <label htmlFor="transition-reason" style={{ display: 'block', marginTop: 8 }}>
                  Reason (optional)
                </label>
                <textarea
                  id="transition-reason"
                  value={transitionReason}
                  onChange={(event) => setTransitionReason(event.target.value)}
                  placeholder={getTransitionReasonPlaceholder(pendingTransition)}
                  disabled={isTransitioning}
                  rows={3}
                  style={{ width: '100%', marginTop: 4 }}
                />
                <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => handleTransitionConfirm()} disabled={isTransitioning}>
                    Confirm transition
                  </button>
                  <button type="button" onClick={cancelPendingTransition} disabled={isTransitioning}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
            {actionMessage ? <p>{actionMessage}</p> : null}
            {actionError ? <p className="error">{actionError}</p> : null}
          </article>

          <article className="card">
            <h3>Status Timeline</h3>
            <ul>
              {payload.statusTimeline.map((event) => (
                <li key={event.id}>
                  {event.fromStatus ?? 'START'} {'->'} {event.toStatus} ({new Date(event.occurredAt).toLocaleString()})
                  {event.reason ? ` - ${event.reason}` : ''}
                </li>
              ))}
              {payload.statusTimeline.length === 0 ? <li>No status events logged yet.</li> : null}
            </ul>
          </article>

          <article className="card">
            <h3>Admin Audit Trail</h3>
            <ul>
              {adminAuditTrail.map((event) => (
                <li key={event.id}>
                  <strong>{getAuditActionLabel(event.actionType)}</strong> ({new Date(event.occurredAt).toLocaleString()})
                  {' - '}
                  {event.fromStatus ?? 'START'} {'->'} {event.toStatus}
                  {event.actorRole ? ` - actor role: ${event.actorRole}` : ''}
                  {event.proposalId ? ` - proposal #${event.proposalId}` : ''}
                  {event.roleChange
                    ? ` - role: ${event.roleChange.fromRole} -> ${event.roleChange.toRole}${
                        event.roleChange.targetUserId ? ` (user #${event.roleChange.targetUserId})` : ''
                      }`
                    : ''}
                  {event.reason ? ` - ${event.reason}` : ''}
                </li>
              ))}
              {adminAuditTrail.length === 0 ? <li>No admin audit events logged yet.</li> : null}
            </ul>
          </article>

          <article className="card">
            <h3>Proposal History</h3>
            <p>Publish a proposal when request is in fee-paid or sourcing state.</p>
            {latestProposal ? (
              <div style={{ marginBottom: 12 }}>
                <p>
                  <strong>Latest proposal:</strong> {latestProposal.merchantName} (
                  <a href={latestProposal.externalUrl} target="_blank" rel="noreferrer">
                    Open
                  </a>
                  )
                </p>
                <p>
                  <strong>Published:</strong> {new Date(latestProposal.publishedAt).toLocaleString()} |{' '}
                  <strong>Expires:</strong> {new Date(latestProposal.expiresAt).toLocaleString()}
                </p>
                <p>
                  <strong>{getProposalCountdownLabel(latestProposal.expiresAt, proposalCountdownNow)}</strong>
                </p>
                {latestProposal.summary ? <p>{latestProposal.summary}</p> : null}
              </div>
            ) : null}
            {canPublishProposal ? (
              <div style={{ marginBottom: 12 }}>
                <label htmlFor="proposal-merchant" style={{ display: 'block', marginTop: 8 }}>
                  Merchant name
                </label>
                <input
                  id="proposal-merchant"
                  value={merchantName}
                  onChange={(event) => setMerchantName(event.target.value)}
                  placeholder="Example merchant"
                  disabled={isPublishingProposal}
                  style={{ width: '100%', marginTop: 4 }}
                />
                <label htmlFor="proposal-url" style={{ display: 'block', marginTop: 8 }}>
                  Proposal URL
                </label>
                <input
                  id="proposal-url"
                  value={externalUrl}
                  onChange={(event) => setExternalUrl(event.target.value)}
                  placeholder="https://merchant.example/proposal"
                  disabled={isPublishingProposal}
                  style={{ width: '100%', marginTop: 4 }}
                />
                <label htmlFor="proposal-summary" style={{ display: 'block', marginTop: 8 }}>
                  Summary (optional)
                </label>
                <textarea
                  id="proposal-summary"
                  value={proposalSummary}
                  onChange={(event) => setProposalSummary(event.target.value)}
                  placeholder="Short operator summary"
                  disabled={isPublishingProposal}
                  rows={3}
                  style={{ width: '100%', marginTop: 4 }}
                />
                <div style={{ marginTop: 8 }}>
                  <button type="button" onClick={handlePublishProposal} disabled={isPublishingProposal}>
                    {isPublishingProposal ? 'Publishing...' : 'Publish proposal'}
                  </button>
                </div>
              </div>
            ) : (
              <p>
                Proposal publishing is unavailable while request is in <strong>{payload.request.status}</strong>. Move
                the request to fee-paid or sourcing first.
              </p>
            )}
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
