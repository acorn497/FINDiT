import { BrowserRouter } from 'react-router';
import { AuthProvider } from './features/auth/AuthContext';
import { NotificationsProvider } from './features/notification/NotificationsContext';
import { ToastProvider } from './shared/toast/ToastContext';
import { ErrorBoundary } from './shared/ui/ErrorBoundary';
import { OfflineBanner } from './shared/ui/OfflineBanner';
import { AppRoutes } from './routes';

export function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <NotificationsProvider>
            <AppRoutes />
          </NotificationsProvider>
        </AuthProvider>
        <OfflineBanner />
      </ToastProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
