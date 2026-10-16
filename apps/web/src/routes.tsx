import { Route, Routes } from 'react-router';
import { LoginPage } from './features/auth/LoginPage';
import { GuestOnly, RequireAuth } from './features/auth/RequireAuth';
import { FoundDetailPage } from './features/found/FoundDetailPage';
import { FoundListPage } from './features/found/FoundListPage';
import { FoundNewPage } from './features/found/FoundNewPage';
import { LostReportNewPage } from './features/lost/LostReportNewPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
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
          <Route index element={<PlaceholderPage title="홈" />} />
          <Route path="found" element={<FoundListPage />} />
          <Route path="found/:id" element={<FoundDetailPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="matches" element={<PlaceholderPage title="매칭 후보" />} />
          <Route path="me/reports" element={<PlaceholderPage title="내 신고 관리" />} />
          <Route path="notifications" element={<PlaceholderPage title="알림" />} />
          <Route path="admin" element={<PlaceholderPage title="관리자" />} />
        </Route>

        {/* 입력 흐름 보호 — 하단 탭을 숨긴다 */}
        <Route path="found/new" element={<FoundNewPage />} />
        <Route path="lost/new" element={<LostReportNewPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
