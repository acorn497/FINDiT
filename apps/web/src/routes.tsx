import { Route, Routes } from 'react-router';
import { LoginPage } from './features/auth/LoginPage';
import { RequireAuth } from './features/auth/RequireAuth';
import { LostReportNewPage } from './features/lost/LostReportNewPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { AppLayout } from './shared/layout/AppLayout';

export function AppRoutes() {
  return (
    <Routes>
      {/* 공개 경로 */}
      <Route path="/login" element={<LoginPage />} />

      {/* 보호 경로 */}
      <Route element={<RequireAuth />}>
        {/* 탭이 보이는 화면 */}
        <Route element={<AppLayout />}>
          <Route index element={<PlaceholderPage title="홈" />} />
          <Route path="found" element={<PlaceholderPage title="습득물 목록" />} />
          <Route path="found/:id" element={<PlaceholderPage title="습득물 상세" />} />
          <Route path="register" element={<PlaceholderPage title="등록하기" />} />
          <Route path="matches" element={<PlaceholderPage title="매칭 후보" />} />
          <Route path="me/reports" element={<PlaceholderPage title="내 신고 관리" />} />
          <Route path="notifications" element={<PlaceholderPage title="알림" />} />
          <Route path="admin" element={<PlaceholderPage title="관리자" />} />
        </Route>

        {/* 입력 흐름 보호 — 하단 탭을 숨긴다 */}
        <Route path="found/new" element={<PlaceholderPage title="습득물 등록" />} />
        <Route path="lost/new" element={<LostReportNewPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
