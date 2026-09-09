import { Route, Routes } from 'react-router';
import { RequireAuth } from './features/auth/RequireAuth';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlaceholderPage } from './pages/PlaceholderPage';

export function AppRoutes() {
  return (
    <Routes>
      {/* 공개 경로 */}
      <Route path="/login" element={<PlaceholderPage title="로그인" />} />

      {/* 보호 경로 */}
      <Route element={<RequireAuth />}>
        <Route index element={<PlaceholderPage title="홈" />} />
        <Route path="found" element={<PlaceholderPage title="습득물 목록" />} />
        <Route path="found/:id" element={<PlaceholderPage title="습득물 상세" />} />
        <Route path="found/new" element={<PlaceholderPage title="습득물 등록" />} />
        <Route path="lost/new" element={<PlaceholderPage title="분실 신고 작성" />} />
        <Route path="register" element={<PlaceholderPage title="등록하기" />} />
        <Route path="matches" element={<PlaceholderPage title="매칭 후보" />} />
        <Route path="me/reports" element={<PlaceholderPage title="내 신고 관리" />} />
        <Route path="notifications" element={<PlaceholderPage title="알림" />} />
        <Route path="admin" element={<PlaceholderPage title="관리자" />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
