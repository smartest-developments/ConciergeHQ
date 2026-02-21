import { FormEvent, useEffect, useState } from 'react';
import { fetchRequests } from '../api';

export function DashboardPage() {
  const [email, setEmail] = useState(localStorage.getItem('acq_user_email') ?? 'demo@acquisitionconcierge.ch');
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
  }>>([]);
  const [error, setError] = useState<string | null>(null);
  const hasProposalNotice = records.some(
    (record) =>
      record.status.startsWith('PROPOSAL') ||
      record.status === 'COMPLETED'
  );

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
    void load(email);
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
              </tr>
            ))}
            {records.length === 0 ? (
              <tr>
                <td colSpan={7}>No requests found.</td>
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
