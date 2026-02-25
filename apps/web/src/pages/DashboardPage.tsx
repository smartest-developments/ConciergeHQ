import { FormEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchRequests } from '../api';

export function DashboardPage() {
  const [searchParams] = useSearchParams();
  const queryEmail = searchParams.get('email')?.trim();
  const initialEmail = queryEmail || localStorage.getItem('acq_user_email') || 'demo@acquisitionconcierge.ch';

  const [email, setEmail] = useState(initialEmail);
  const [records, setRecords] = useState<Array<{
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
  }>>([]);
  const [error, setError] = useState<string | null>(null);
  const hasProposalNotice = records.some((record) => record.proposal !== null);

  async function load(targetEmail: string) {
    try {
      setError(null);
      const response = await fetchRequests(targetEmail || undefined);
      setRecords(response.requests);
    } catch {
      setError('Could not load requests dashboard.');
    }
  }

  useEffect(() => {
    localStorage.setItem('acq_user_email', initialEmail);
    void load(initialEmail);
  }, []);

  async function onFilter(event: FormEvent) {
    event.preventDefault();
    localStorage.setItem('acq_user_email', email);
    await load(email);
  }

  return (
    <section>
      <h2>Requests Dashboard</h2>
      <form onSubmit={onFilter} className="card inline-form">
        <label>
          User email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <button type="submit">Refresh</button>
      </form>

      {error ? <p className="error">{error}</p> : null}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>Category</th>
              <th>Budget</th>
              <th>Fee</th>
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
                <td colSpan={8}>No requests found.</td>
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
