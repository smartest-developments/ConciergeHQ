import { useEffect, useState } from 'react';
import { fetchRequests } from '../api';
import { readAuthSession } from '../auth';

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
                      <a href={record.proposal.externalUrl} target="_blank" rel="noreferrer">
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
    </section>
  );
}
