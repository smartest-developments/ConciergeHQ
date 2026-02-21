import { Navigate, createBrowserRouter } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { CreateRequestPage } from './pages/CreateRequestPage';
import { PaymentPage } from './pages/PaymentPage';
import { DashboardPage } from './pages/DashboardPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/requests/new" replace /> },
      { path: '/requests/new', element: <CreateRequestPage /> },
      { path: '/payment/:requestId', element: <PaymentPage /> },
      { path: '/dashboard', element: <DashboardPage /> }
    ]
  }
]);
