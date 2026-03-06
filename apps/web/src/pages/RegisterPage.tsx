import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { saveAuthSession } from '../auth';

function normalizeNextPath(value: string | null): string {
  if (!value) {
    return '/dashboard';
  }

  if (!value.startsWith('/') || value.startsWith('//')) {
    return '/dashboard';
  }

  return value;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const nextPath = normalizeNextPath(searchParams.get('next'));

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError('Email is required.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }

    saveAuthSession({ email: normalizedEmail, role: 'CUSTOMER' });
    localStorage.setItem('acq_user_email', normalizedEmail);
    navigate(nextPath, { replace: true });
  }

  return (
    <section>
      <h2>Create Account</h2>
      <p>Create your account credentials. This page will be wired to backend auth APIs next.</p>

      <form className="card form-grid" onSubmit={onSubmit}>
        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        <label>
          Confirm Password
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button type="submit">Create account</button>
      </form>

      <p>
        Already have an account? <Link to="/auth/login">Sign in</Link>
      </p>
    </section>
  );
}
