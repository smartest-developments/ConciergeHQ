import { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    if (!token) {
      setError('Reset token is missing or invalid.');
      setStatus(null);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      setStatus(null);
      return;
    }

    if (password !== confirmPassword) {
      setError('Password confirmation does not match.');
      setStatus(null);
      return;
    }

    setSubmitting(true);
    setError(null);
    setStatus(null);
    try {
      await resetPassword(token, password);
      setStatus('Password reset successful. You can now sign in with your new password.');
    } catch (requestError) {
      if (requestError instanceof Error && requestError.message === 'INVALID_RESET_TOKEN') {
        setError('Reset token is missing, expired, or invalid.');
      } else {
        setError('Unable to reset password. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <h2>Reset Password</h2>
      <p>Set a new password using the reset token from your recovery email.</p>

      <form className="card form-grid" onSubmit={onSubmit}>
        <label>
          New Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        <label>
          Confirm New Password
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Resetting...' : 'Reset password'}
        </button>
      </form>

      {status ? <p className="card">{status}</p> : null}

      <p>
        Back to <Link to="/auth/login">Sign in</Link>
      </p>
    </section>
  );
}
