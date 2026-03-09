import { type FormEvent, useEffect, useState } from 'react';
import { fetchRequests, submitSupportTicket } from '../api';
import { readAuthSession } from '../auth';
import { trackFunnelEvent } from '../telemetry';

const PAYMENT_NOTICE_STORAGE_KEY = 'acq_payment_notice';

type PaymentNotice = {
  type: 'cancelled' | 'failed';
  requestId: number | null;
};

type DashboardRecord = {
  id: number;
  status: string;
  userEmail: string;
  budgetChf: number;
  sourcingFeeChf: number;
  category: string;
  country: string;
  condition: string;
  urgency: string;
  createdAt: string;
  feePaidAt: string | null;
  proposal: {
    id: number;
    merchantName: string;
    externalUrl: string;
    summary: string | null;
    publishedAt: string;
    expiresAt: string;
  } | null;
};

function renderPaymentState(record: DashboardRecord) {
  if (record.feePaidAt) {
    return `Paid on ${new Date(record.feePaidAt).toLocaleString()}`;
  }

  if (record.status === 'FEE_PENDING') {
    return (
      <div className="proposal-cell">
        <span className="warning">Awaiting fee payment.</span>
        <a href={`/payment/${record.id}?fee=${record.sourcingFeeChf}`}>Retry payment checkout</a>
      </div>
    );
  }

  return 'Not paid yet';
}

export function DashboardPage() {
  const session = readAuthSession();
  const email = session?.email ?? 'unknown';
  const [records, setRecords] = useState<DashboardRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [paymentNotice, setPaymentNotice] = useState<PaymentNotice | null>(null);
  const [supportRequestId, setSupportRequestId] = useState('');
  const [supportSeverity, setSupportSeverity] = useState<'SEV-1' | 'SEV-2' | 'SEV-3'>('SEV-3');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportError, setSupportError] = useState<string | null>(null);
  const [supportSuccess, setSupportSuccess] = useState<string | null>(null);
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  const hasProposalNotice = records.some((record) => record.proposal !== null);

  async function load() {
    try {
      setError(null);
      const response = await fetchRequests();
      setRecords(response.requests);
    } catch {
      setError('Could not load requests dashboard.');
    }
  }

  useEffect(() => {
    void load();

    const rawPaymentNotice = localStorage.getItem(PAYMENT_NOTICE_STORAGE_KEY);
    if (rawPaymentNotice) {
      try {
        const parsed = JSON.parse(rawPaymentNotice) as PaymentNotice;
        if (parsed.type === 'cancelled' || parsed.type === 'failed') {
          setPaymentNotice(parsed);
        }
      } catch {
        // Ignore malformed persisted notices.
      }
      localStorage.removeItem(PAYMENT_NOTICE_STORAGE_KEY);
    }
  }, []);

  const handleSupportSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSupportError(null);
    setSupportSuccess(null);

    const requestId = Number(supportRequestId);
    const normalizedMessage = supportMessage.trim();

    if (!Number.isInteger(requestId) || requestId <= 0) {
      setSupportError('Select a valid request before submitting support escalation.');
      return;
    }

    if (normalizedMessage.length < 10 || normalizedMessage.length > 1000) {
      setSupportError('Support message must be between 10 and 1000 characters.');
      return;
    }

    setIsSubmittingSupport(true);

    try {
      await submitSupportTicket(requestId, {
        severity: supportSeverity,
        source: 'CUSTOMER_DASHBOARD',
        message: normalizedMessage
      });
      setSupportSuccess(`Support ticket submitted for request #${requestId} (${supportSeverity}).`);
      setSupportMessage('');
    } catch (caughtError) {
      if (caughtError instanceof Error && caughtError.message === 'REQUEST_FORBIDDEN') {
        setSupportError('You can submit support tickets only for your own requests.');
      } else if (caughtError instanceof Error && caughtError.message === 'AUTH_REQUIRED') {
        setSupportError('Session expired. Sign in again and retry support ticket submission.');
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
      <h2>Requests Dashboard</h2>
      <p className="card">Session customer: {email}</p>

      {error ? <p className="error">{error}</p> : null}
      {paymentNotice ? (
        <p className={paymentNotice.type === 'failed' ? 'error' : 'warning'}>
          {paymentNotice.type === 'failed'
            ? `Payment failed for request #${paymentNotice.requestId ?? 'unknown'}. No charge was captured.`
            : `Payment checkout was cancelled for request #${paymentNotice.requestId ?? 'unknown'}. You can retry below.`}
        </p>
      ) : null}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>Category</th>
              <th>Budget</th>
              <th>Fee</th>
              <th>Payment</th>
              <th>Country</th>
              <th>Created</th>
              <th>Proposal</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>{record.id}</td>
                <td>{record.status}</td>
                <td>{record.category}</td>
                <td>{record.budgetChf} CHF</td>
                <td>{record.sourcingFeeChf} CHF</td>
                <td>{renderPaymentState(record)}</td>
                <td>{record.country}</td>
                <td>{new Date(record.createdAt).toLocaleString()}</td>
                <td>
                  {record.proposal ? (
                    <div className="proposal-cell">
                      <a
                        href={record.proposal.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => trackFunnelEvent('proposal_open', { requestId: record.id })}
                      >
                        {record.proposal.merchantName}
                      </a>
                      <small>Expires: {new Date(record.proposal.expiresAt).toLocaleString()}</small>
                    </div>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
            {records.length === 0 ? (
              <tr>
                <td colSpan={9}>No requests found.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {hasProposalNotice ? (
        <p className="warning">
          Proposal links are time-bound and expire 2 hours after publication. Purchases happen on the external
          merchant site; Acquisition Concierge is not the seller and does not provide after-sales support.
        </p>
      ) : null}
      <section className="card" aria-labelledby="support-routing-title">
        <h3 id="support-routing-title">Support and escalation</h3>
        <p>
          Contact <a href="mailto:support@acquisition-concierge.example">support@acquisition-concierge.example</a> for
          request updates or report disputes.
        </p>
        <ul>
          <li>
            <strong>SEV-3:</strong> non-blocking question or copy issue. Response target: 24h.
          </li>
          <li>
            <strong>SEV-2:</strong> request flow blocked (payment, missing timeline update). Response target: 4h.
          </li>
          <li>
            <strong>SEV-1:</strong> legal/security or wrong-order risk. Escalate to{' '}
            <a href="mailto:legal-security@acquisition-concierge.example">legal-security@acquisition-concierge.example</a>{' '}
            immediately.
          </li>
        </ul>
        <form onSubmit={handleSupportSubmit} style={{ marginTop: 12 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Request
            <select
              value={supportRequestId}
              onChange={(event) => setSupportRequestId(event.target.value)}
              style={{ marginLeft: 8 }}
            >
              <option value="">Select request</option>
              {records.map((record) => (
                <option key={record.id} value={record.id}>
                  #{record.id} ({record.status})
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Severity
            <select
              value={supportSeverity}
              onChange={(event) => setSupportSeverity(event.target.value as 'SEV-1' | 'SEV-2' | 'SEV-3')}
              style={{ marginLeft: 8 }}
            >
              <option value="SEV-3">SEV-3</option>
              <option value="SEV-2">SEV-2</option>
              <option value="SEV-1">SEV-1</option>
            </select>
          </label>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Message
            <textarea
              aria-label="Support message"
              value={supportMessage}
              onChange={(event) => setSupportMessage(event.target.value)}
              placeholder="Describe the support issue..."
              rows={3}
              style={{ display: 'block', width: '100%', marginTop: 4 }}
            />
          </label>
          <button type="submit" disabled={isSubmittingSupport}>
            {isSubmittingSupport ? 'Submitting support ticket...' : 'Submit support ticket'}
          </button>
          {supportError ? <p className="error">{supportError}</p> : null}
          {supportSuccess ? <p>{supportSuccess}</p> : null}
        </form>
      </section>
    </section>
  );
}
