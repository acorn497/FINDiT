import { BrowserRouter } from 'react-router';
import { AuthProvider } from './features/auth/AuthContext';
import { AppRoutes } from './routes';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
