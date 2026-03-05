import { FormEvent, useEffect, useMemo, useState } from 'react';
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
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  async function load(nextPage: number) {
    try {
      setError(null);
      const response = await fetchRequests({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        category: categoryFilter === 'ALL' ? undefined : categoryFilter,
        country: countryFilter === 'ALL' ? undefined : countryFilter,
        dateFrom: dateFrom ? new Date(`${dateFrom}T00:00:00.000Z`).toISOString() : undefined,
        dateTo: dateTo ? new Date(`${dateTo}T23:59:59.999Z`).toISOString() : undefined,
        page: nextPage,
        pageSize
      });
      setRecords(response.requests);
      setPage(response.pagination?.page ?? nextPage);
      setTotal(response.pagination?.total ?? response.requests.length);
      setTotalPages(Math.max(response.pagination?.totalPages ?? 1, 1));
    } catch {
      setError('Could not load operator queue.');
    }
  }

  useEffect(() => {
    void load(1);
  }, []);

  const statusOptions = useMemo(() => getFilterOptions(records, 'status'), [records]);
  const categoryOptions = useMemo(() => getFilterOptions(records, 'category'), [records]);
  const countryOptions = useMemo(() => getFilterOptions(records, 'country'), [records]);

  async function onApplyFilters(event: FormEvent) {
    event.preventDefault();
    await load(1);
  }

  return (
    <section>
      <h2>Operator Queue</h2>
      <p>Filter incoming requests for manual triage. Admin authentication is planned in ACQ-AUTH-001.</p>

      <form className="card form-grid" onSubmit={onApplyFilters}>
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

        <label>
          Date from
          <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
        </label>

        <label>
          Date to
          <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        </label>

        <button type="submit">Apply filters</button>
      </form>

      {error ? <p className="error">{error}</p> : null}

      <div className="card">
        <p className="queue-summary">
          Visible requests: {records.length} (total matching: {total})
        </p>
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
            {records.map((record) => (
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
            {records.length === 0 ? (
              <tr>
                <td colSpan={7}>No requests match the selected filters.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <div className="inline-form">
          <button type="button" onClick={() => void load(page - 1)} disabled={page <= 1}>
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button type="button" onClick={() => void load(page + 1)} disabled={page >= totalPages}>
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
