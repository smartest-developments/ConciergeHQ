import { Navigate, createBrowserRouter } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { RequireSession } from './auth';
import { CreateRequestPage } from './pages/CreateRequestPage';
import { PaymentPage } from './pages/PaymentPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { DashboardPage } from './pages/DashboardPage';
import { OperatorQueuePage } from './pages/OperatorQueuePage';
import { OperatorRequestDetailPage } from './pages/OperatorRequestDetailPage';
import { SessionBootstrapPage } from './pages/SessionBootstrapPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { LegalPage } from './pages/LegalPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/requests/new" replace /> },
      { path: '/auth/login', element: <SessionBootstrapPage /> },
      { path: '/auth/register', element: <RegisterPage /> },
      { path: '/auth/forgot', element: <ForgotPasswordPage /> },
      { path: '/auth/reset', element: <ResetPasswordPage /> },
      { path: '/auth/session', element: <Navigate to="/auth/login" replace /> },
      { path: '/legal', element: <LegalPage /> },
      {
        path: '/requests/new',
        element: (
          <RequireSession>
            <CreateRequestPage />
          </RequireSession>
        )
      },
      {
        path: '/payment/:requestId',
        element: (
          <RequireSession>
            <PaymentPage />
          </RequireSession>
        )
      },
      {
        path: '/payment-success',
        element: (
          <RequireSession>
            <PaymentSuccessPage />
          </RequireSession>
        )
      },
      {
        path: '/dashboard',
        element: (
          <RequireSession>
            <DashboardPage />
          </RequireSession>
        )
      },
      {
        path: '/operator/queue',
        element: (
          <RequireSession allowedRoles={['OPERATOR', 'ADMIN']}>
            <OperatorQueuePage />
          </RequireSession>
        )
      },
      {
        path: '/operator/requests/:requestId',
        element: (
          <RequireSession allowedRoles={['OPERATOR', 'ADMIN']}>
            <OperatorRequestDetailPage />
          </RequireSession>
        )
      }
    ]
  }
]);
