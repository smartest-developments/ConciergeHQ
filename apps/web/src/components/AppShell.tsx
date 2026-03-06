import { NavLink, Outlet } from 'react-router-dom';
import { clearAuthSession, useClientSession } from '../auth';

export function AppShell() {
  const session = useClientSession();

  function onSignOut() {
    clearAuthSession();
    window.location.assign('/auth/login');
  }

  return (
    <div className="layout">
      <header>
        <h1>Acquisition Concierge</h1>
        <p className="tagline">Paid sourcing service for EU + CH external purchases.</p>
        <div className="session-chip">
          {session ? (
            <>
              <span>
                Signed in as <strong>{session.email}</strong> ({session.role})
              </span>
              <button type="button" onClick={onSignOut}>
                Sign out
              </button>
            </>
          ) : (
            <span>Signed out</span>
          )}
        </div>
        <nav>
          <NavLink to="/requests/new">New Request</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/operator/queue">Operator Queue</NavLink>
          <NavLink to="/auth/login">Sign In</NavLink>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
