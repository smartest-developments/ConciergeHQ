import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
type SortBy = 'createdAt' | 'budgetChf';
type SortDirection = 'asc' | 'desc';

const DEFAULT_SORT_BY: SortBy = 'createdAt';
const DEFAULT_SORT_DIRECTION: SortDirection = 'desc';

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseSortBy(value: string | null): SortBy {
  return value === 'budgetChf' ? 'budgetChf' : DEFAULT_SORT_BY;
}

function parseSortDirection(value: string | null): SortDirection {
  return value === 'asc' ? 'asc' : DEFAULT_SORT_DIRECTION;
}

function getFilterOptions(records: QueueRecord[], key: keyof Pick<QueueRecord, 'status' | 'category' | 'country'>) {
  return Array.from(new Set(records.map((record) => record[key]))).sort();
}

export function OperatorQueuePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<FilterValue>(searchParams.get('status') ?? 'ALL');
  const [categoryFilter, setCategoryFilter] = useState<FilterValue>(searchParams.get('category') ?? 'ALL');
  const [countryFilter, setCountryFilter] = useState<FilterValue>(searchParams.get('country') ?? 'ALL');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') ?? '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') ?? '');
  const [sortBy, setSortBy] = useState<SortBy>(parseSortBy(searchParams.get('sortBy')));
  const [sortDirection, setSortDirection] = useState<SortDirection>(parseSortDirection(searchParams.get('sortDir')));
  const [page, setPage] = useState(parsePositiveInt(searchParams.get('page'), 1));
  const [records, setRecords] = useState<QueueRecord[]>([]);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  function persistQuery(nextPage: number, nextSortBy = sortBy, nextSortDirection = sortDirection) {
    const nextParams = new URLSearchParams();

    if (statusFilter !== 'ALL') nextParams.set('status', statusFilter);
    if (categoryFilter !== 'ALL') nextParams.set('category', categoryFilter);
    if (countryFilter !== 'ALL') nextParams.set('country', countryFilter);
    if (dateFrom) nextParams.set('dateFrom', dateFrom);
    if (dateTo) nextParams.set('dateTo', dateTo);
    if (nextPage > 1) nextParams.set('page', String(nextPage));
    if (nextSortBy !== DEFAULT_SORT_BY) nextParams.set('sortBy', nextSortBy);
    if (nextSortDirection !== DEFAULT_SORT_DIRECTION) nextParams.set('sortDir', nextSortDirection);

    setSearchParams(nextParams, { replace: true });
  }

  async function load(nextPage: number) {
    try {
      setError(null);
      const response = await fetchRequests({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        category: categoryFilter === 'ALL' ? undefined : categoryFilter,
        country: countryFilter === 'ALL' ? undefined : countryFilter,
        dateFrom: dateFrom ? new Date(`${dateFrom}T00:00:00.000Z`).toISOString() : undefined,
        dateTo: dateTo ? new Date(`${dateTo}T23:59:59.999Z`).toISOString() : undefined,
        sortBy,
        sortDir: sortDirection,
        page: nextPage,
        pageSize
      });
      setRecords(response.requests);
      setPage(response.pagination?.page ?? nextPage);
      setTotal(response.pagination?.total ?? response.requests.length);
      setTotalPages(Math.max(response.pagination?.totalPages ?? 1, 1));
      persistQuery(nextPage);
    } catch {
      setError('Could not load operator queue.');
    }
  }

  useEffect(() => {
    void load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <label>
          Sort by
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortBy)}>
            <option value="createdAt">Created date</option>
            <option value="budgetChf">Budget (CHF)</option>
          </select>
        </label>

        <label>
          Direction
          <select value={sortDirection} onChange={(event) => setSortDirection(event.target.value as SortDirection)}>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </label>
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
              <th>Actions</th>
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
                <td>
                  <Link to={`/operator/requests/${record.id}`}>Open detail</Link>
                </td>
              </tr>
            ))}
            {records.length === 0 ? (
              <tr>
                <td colSpan={8}>No requests match the selected filters.</td>
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
