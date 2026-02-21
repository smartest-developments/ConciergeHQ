import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { markFeePaid } from '../api';

export function PaymentPage() {
  const navigate = useNavigate();
  const { requestId } = useParams<{ requestId: string }>();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fee = searchParams.get('fee') ?? '0';
  const parsedRequestId = Number(requestId);

  async function markPaid() {
    setError(null);
    setLoading(true);

    try {
      await markFeePaid(parsedRequestId);
      const email = localStorage.getItem('acq_user_email');
      navigate(`/dashboard${email ? `?email=${encodeURIComponent(email)}` : ''}`);
    } catch (paymentError) {
      setError(paymentError instanceof Error ? paymentError.message : 'Unable to update payment state');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h2>Sourcing Fee Placeholder</h2>
      <p>Request #{requestId}</p>
      <p>
        Fee due: <strong>{fee} CHF</strong>
      </p>
      <p>
        This is a mock step for v1 bootstrap. No real payment processing is implemented in this flow.
      </p>
      <p className="warning">
        Fee is non-refundable and pays for research work only. Product purchase happens on the external merchant site.
      </p>
      {error ? <p className="error">{error}</p> : null}
      <button type="button" disabled={loading || !Number.isInteger(parsedRequestId)} onClick={markPaid}>
        {loading ? 'Updating...' : 'Mark Sourcing Fee as Paid'}
      </button>
    </section>
  );
}
