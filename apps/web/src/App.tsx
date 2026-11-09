import { BrowserRouter } from 'react-router';
import { AuthProvider } from './features/auth/AuthContext';
import { NotificationsProvider } from './features/notification/NotificationsContext';
import { ToastProvider } from './shared/toast/ToastContext';
import { AppRoutes } from './routes';

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <NotificationsProvider>
            <AppRoutes />
          </NotificationsProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
