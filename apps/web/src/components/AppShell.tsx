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
          <NavLink to="/auth/register">Create Account</NavLink>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer>
        <nav aria-label="Legal">
          <a href="#legal-privacy">Privacy Policy</a>
          <a href="#legal-terms">Terms of Service</a>
        </nav>
        <section aria-label="Legal policy summary">
          <h2 id="legal-privacy">Privacy Policy</h2>
          <p>
            We process account and sourcing-request data only to deliver the informational concierge service,
            with GDPR export/deletion rights available to authenticated users.
          </p>
          <h2 id="legal-terms">Terms of Service</h2>
          <p>
            Acquisition Concierge is not the merchant of record. Platform fees cover sourcing research and are
            non-refundable once work begins; final purchase contracts remain between customer and external seller.
          </p>
        </section>
      </footer>
    </div>
  );
}
