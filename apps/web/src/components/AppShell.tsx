import { NavLink, Outlet } from 'react-router-dom';

export function AppShell() {
  return (
    <div className="layout">
      <header>
        <h1>Acquisition Concierge</h1>
        <p className="tagline">Paid sourcing service for EU + CH external purchases.</p>
        <nav>
          <NavLink to="/requests/new">New Request</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
