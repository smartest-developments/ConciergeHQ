import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { clearAuthSession, readAuthSession, saveAuthSession, type SessionRole } from '../auth';

const DEFAULT_EMAIL = 'demo@acquisitionconcierge.ch';

function normalizeNextPath(value: string | null): string {
  if (!value) {
    return '/dashboard';
  }

  if (!value.startsWith('/') || value.startsWith('//')) {
    return '/dashboard';
  }

  return value;
}

export function SessionBootstrapPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentSession = useMemo(() => readAuthSession(), []);
  const [email, setEmail] = useState(currentSession?.email ?? localStorage.getItem('acq_user_email') ?? DEFAULT_EMAIL);
  const [role, setRole] = useState<SessionRole>(currentSession?.role ?? 'CUSTOMER');
  const [error, setError] = useState<string | null>(null);
  const nextPath = normalizeNextPath(searchParams.get('next'));

  function onSignIn(event: FormEvent) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Email is required.');
      return;
    }

    saveAuthSession({ email: normalizedEmail, role });
    localStorage.setItem('acq_user_email', normalizedEmail);
    navigate(nextPath, { replace: true });
  }

  function onSignOut() {
    clearAuthSession();
    navigate('/auth/login', { replace: true });
  }

  return (
    <section>
      <h2>Sign In</h2>
      <p>Choose role and email to continue while server-side cookie login endpoints are being finalized.</p>

      {currentSession ? (
        <p className="card">
          Active session: <strong>{currentSession.email}</strong> ({currentSession.role})
        </p>
      ) : null}

      <form className="card form-grid" onSubmit={onSignIn}>
        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          Role
          <select value={role} onChange={(event) => setRole(event.target.value as SessionRole)}>
            <option value="CUSTOMER">CUSTOMER</option>
            <option value="OPERATOR">OPERATOR</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button type="submit">Sign in</button>
        <button type="button" onClick={onSignOut}>
          Sign out
        </button>
      </form>

      <p>
        Need an account? <Link to="/auth/register">Create account</Link>
      </p>
      <p>
        Forgot password? <Link to="/auth/forgot">Reset it</Link>
      </p>
    </section>
  );
}
