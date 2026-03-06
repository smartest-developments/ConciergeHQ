import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError('Email is required.');
      setStatus(null);
      return;
    }

    setError(null);
    setStatus('If this email exists, a reset link will be sent.');
  }

  return (
    <section>
      <h2>Forgot Password</h2>
      <p>Request a password reset link. Backend token delivery will be wired in the next auth API slice.</p>

      <form className="card form-grid" onSubmit={onSubmit}>
        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button type="submit">Send reset link</button>
      </form>

      {status ? <p className="card">{status}</p> : null}

      <p>
        Back to <Link to="/auth/login">Sign in</Link>
      </p>
    </section>
  );
}
