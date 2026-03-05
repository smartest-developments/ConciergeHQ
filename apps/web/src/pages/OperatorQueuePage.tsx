import { useEffect, useMemo, useState } from 'react';
import { fetchRequests } from '../api';

type QueueRecord = {
  id: number;
  status: string;
  userEmail: string;
  budgetChf: number;
  category: string;
  country: string;
  createdAt: string;
};

type FilterValue = 'ALL' | string;

function getFilterOptions(records: QueueRecord[], key: keyof Pick<QueueRecord, 'status' | 'category' | 'country'>) {
  return Array.from(new Set(records.map((record) => record[key]))).sort();
}

export function OperatorQueuePage() {
  const [records, setRecords] = useState<QueueRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<FilterValue>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<FilterValue>('ALL');
  const [countryFilter, setCountryFilter] = useState<FilterValue>('ALL');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        const response = await fetchRequests();
        setRecords(response.requests);
      } catch {
        setError('Could not load operator queue.');
      }
    }

    void load();
  }, []);

  const filteredRecords = useMemo(
    () =>
      records.filter((record) => {
        const statusMatch = statusFilter === 'ALL' || record.status === statusFilter;
        const categoryMatch = categoryFilter === 'ALL' || record.category === categoryFilter;
        const countryMatch = countryFilter === 'ALL' || record.country === countryFilter;
        return statusMatch && categoryMatch && countryMatch;
      }),
    [records, statusFilter, categoryFilter, countryFilter]
  );

  const statusOptions = useMemo(() => getFilterOptions(records, 'status'), [records]);
  const categoryOptions = useMemo(() => getFilterOptions(records, 'category'), [records]);
  const countryOptions = useMemo(() => getFilterOptions(records, 'country'), [records]);

  return (
    <section>
      <h2>Operator Queue</h2>
      <p>Filter incoming requests for manual triage. Admin authentication is planned in ACQ-AUTH-001.</p>

      <div className="card form-grid">
        <label>
          Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="ALL">All statuses</option>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label>
          Category
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="ALL">All categories</option>
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label>
          Country
          <select value={countryFilter} onChange={(event) => setCountryFilter(event.target.value)}>
            <option value="ALL">All countries</option>
            {countryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <div className="card">
        <p className="queue-summary">Visible requests: {filteredRecords.length}</p>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Status</th>
              <th>Category</th>
              <th>Country</th>
              <th>Budget</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record) => (
              <tr key={record.id}>
                <td>{record.id}</td>
                <td>{record.userEmail}</td>
                <td>{record.status}</td>
                <td>{record.category}</td>
                <td>{record.country}</td>
                <td>{record.budgetChf} CHF</td>
                <td>{new Date(record.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={7}>No requests match the selected filters.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
