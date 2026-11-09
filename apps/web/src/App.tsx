import { BrowserRouter } from 'react-router';
import { AuthProvider } from './features/auth/AuthContext';
import { ToastProvider } from './shared/toast/ToastContext';
import { AppRoutes } from './routes';

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
