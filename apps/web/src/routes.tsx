import { Route, Routes } from 'react-router';
import { LoginPage } from './features/auth/LoginPage';
import { GuestOnly, RequireAuth } from './features/auth/RequireAuth';
import { RequireRole } from './features/auth/RequireRole';
import { AdminPage } from './features/admin/AdminPage';
import { FoundDetailPage } from './features/found/FoundDetailPage';
import { FoundListPage } from './features/found/FoundListPage';
import { FoundNewPage } from './features/found/FoundNewPage';
import { HomePage } from './features/home/HomePage';
import { LostReportNewPage } from './features/lost/LostReportNewPage';
import { MatchesPage } from './features/match/MatchesPage';
import { NotificationsPage } from './features/notification/NotificationsPage';
import { MyReportsPage } from './features/reports/MyReportsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RegisterPage } from './pages/RegisterPage';
import { AppLayout } from './shared/layout/AppLayout';

export function AppRoutes() {
  return (
    <Routes>
      {/* 공개 경로 */}
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* 보호 경로 */}
      <Route element={<RequireAuth />}>
        {/* 탭이 보이는 화면 */}
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="found" element={<FoundListPage />} />
          <Route path="found/:id" element={<FoundDetailPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="matches" element={<MatchesPage />} />
          <Route path="me/reports" element={<MyReportsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route element={<RequireRole role="TEACHER" />}>
            <Route path="admin" element={<AdminPage />} />
          </Route>
        </Route>

        {/* 입력 흐름 보호 — 하단 탭을 숨긴다 */}
        <Route path="found/new" element={<FoundNewPage />} />
        <Route path="lost/new" element={<LostReportNewPage />} />
        <Route path="lost/:id/edit" element={<LostReportNewPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
