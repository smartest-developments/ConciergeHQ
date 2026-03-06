import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export type SessionRole = 'CUSTOMER' | 'OPERATOR' | 'ADMIN';

export type AuthSession = {
  email: string;
  role: SessionRole;
};

const SESSION_STORAGE_KEY = 'acq_auth_session';

function normalizeSession(payload: unknown): AuthSession | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const { email, role } = payload as Partial<AuthSession>;
  if (!email || typeof email !== 'string') {
    return null;
  }
  if (role !== 'CUSTOMER' && role !== 'OPERATOR' && role !== 'ADMIN') {
    return null;
  }

  return {
    email: email.trim().toLowerCase(),
    role
  };
}

export function readAuthSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!rawSession) {
    return null;
  }

  try {
    return normalizeSession(JSON.parse(rawSession));
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthSession) {
  if (typeof window === 'undefined') {
    return;
  }

  const normalized = normalizeSession(session);
  if (!normalized) {
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(normalized));
}

export function clearAuthSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function useClientSession() {
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    setSession(readAuthSession());
  }, []);

  return session;
}

export function RequireSession({
  children,
  allowedRoles
}: {
  children: ReactNode;
  allowedRoles?: SessionRole[];
}) {
  const location = useLocation();
  const session = useClientSession();

  if (!session) {
    const nextPath = `${location.pathname}${location.search}`;
    return <Navigate to={`/auth/login?next=${encodeURIComponent(nextPath)}`} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return (
      <section className="card">
        <h2>Access denied</h2>
        <p>This area requires role {allowedRoles.join(' or ')}.</p>
      </section>
    );
  }

  return <>{children}</>;
}
