import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { createCheckoutSession } from '../api';

const PAYMENT_NOTICE_STORAGE_KEY = 'acq_payment_notice';

export function PaymentPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fee = searchParams.get('fee') ?? '0';
  const cancelled = searchParams.get('cancelled') === 'true';
  const parsedRequestId = Number(requestId);

  useEffect(() => {
    if (!cancelled) {
      return;
    }

    localStorage.setItem(
      PAYMENT_NOTICE_STORAGE_KEY,
      JSON.stringify({
        type: 'cancelled',
        requestId: Number.isInteger(parsedRequestId) ? parsedRequestId : null
      })
    );
  }, [cancelled, parsedRequestId]);

  async function beginCheckout() {
    setError(null);
    setLoading(true);

    try {
      const session = await createCheckoutSession(parsedRequestId);
      if (!session.checkoutUrl) {
        throw new Error('Payment provider returned no checkout URL');
      }
      window.location.assign(session.checkoutUrl);
    } catch (paymentError) {
      localStorage.setItem(
        PAYMENT_NOTICE_STORAGE_KEY,
        JSON.stringify({
          type: 'failed',
          requestId: Number.isInteger(parsedRequestId) ? parsedRequestId : null
        })
      );
      setError(paymentError instanceof Error ? paymentError.message : 'Unable to start payment');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h2>Sourcing Fee Checkout</h2>
      <p>Request #{requestId}</p>
      <p>
        Fee due: <strong>{fee} CHF</strong>
      </p>
      {cancelled ? <p className="warning">Payment was cancelled. You can try again below.</p> : null}
      <p className="warning">
        Fee is non-refundable and pays for research work only. Product purchase happens on the external merchant site.
      </p>
      {error ? <p className="error">{error}</p> : null}
      <button type="button" disabled={loading || !Number.isInteger(parsedRequestId)} onClick={beginCheckout}>
        {loading ? 'Redirecting...' : 'Pay Sourcing Fee'}
      </button>
    </section>
  );
}
