import { Navigate, createBrowserRouter } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { CreateRequestPage } from './pages/CreateRequestPage';
import { PaymentPage } from './pages/PaymentPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { DashboardPage } from './pages/DashboardPage';
import { OperatorQueuePage } from './pages/OperatorQueuePage';
import { OperatorRequestDetailPage } from './pages/OperatorRequestDetailPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/requests/new" replace /> },
      { path: '/requests/new', element: <CreateRequestPage /> },
      { path: '/payment/:requestId', element: <PaymentPage /> },
      { path: '/payment-success', element: <PaymentSuccessPage /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/operator/queue', element: <OperatorQueuePage /> },
      { path: '/operator/requests/:requestId', element: <OperatorRequestDetailPage /> }
    ]
  }
]);
