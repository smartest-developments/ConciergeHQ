import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { confirmPayment } from '../api';

export function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const sessionId = searchParams.get('session_id') ?? '';
  const requestId = Number(searchParams.get('requestId'));

  useEffect(() => {
    if (!sessionId || !Number.isInteger(requestId)) {
      setError('Missing payment session details.');
      setLoading(false);
      return;
    }

    confirmPayment(requestId, sessionId)
      .then(() => {
        const email = localStorage.getItem('acq_user_email');
        navigate(`/dashboard${email ? `?email=${encodeURIComponent(email)}` : ''}`);
      })
      .catch((paymentError) => {
        setError(paymentError instanceof Error ? paymentError.message : 'Unable to confirm payment');
        setLoading(false);
      });
  }, [navigate, requestId, sessionId]);

  if (loading) {
    return (
      <section className="card">
        <h2>Confirming Payment</h2>
        <p>Validating your sourcing fee payment...</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Payment Status</h2>
      {error ? <p className="error">{error}</p> : <p>Payment confirmed. Redirecting you to the dashboard.</p>}
    </section>
  );
}
