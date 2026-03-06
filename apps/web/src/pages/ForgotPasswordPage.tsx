import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../api';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError('Email is required.');
      setStatus(null);
      return;
    }

    setSubmitting(true);
    setError(null);
    setStatus(null);

    try {
      await requestPasswordReset(normalizedEmail);
      setStatus('If this email exists, a reset link will be sent.');
    } catch {
      setError('Unable to submit password reset request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <h2>Forgot Password</h2>
      <p>Request a password reset link.</p>

      <form className="card form-grid" onSubmit={onSubmit}>
        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      {status ? <p className="card">{status}</p> : null}

      <p>
        Back to <Link to="/auth/login">Sign in</Link>
      </p>
    </section>
  );
}
