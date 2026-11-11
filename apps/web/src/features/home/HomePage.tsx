import type { FoundItemStatus, LostReportStatus } from '@findit/shared';
import { ChevronRight, ClipboardCheck, HandHeart, ImageOff, LogOut, PackageSearch, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { useAsync } from '../../shared/hooks/useAsync';
import { AppBar } from '../../shared/layout/AppBar';
import { Logo } from '../../shared/layout/Logo';
import { Button } from '../../shared/ui/Button';
import { LoadingBlock } from '../../shared/ui/LoadingBlock';
import { StateView } from '../../shared/ui/StateView';
import { FoundStatusBadge, LostStatusBadge } from '../../shared/ui/StatusBadge';
import { useAuth } from '../auth/AuthContext';
import { FoundCard } from '../found/FoundCard';
import { homeApi } from './api';

function Section({ title, more, children }: { title: string; more: string; children: ReactNode }) {
  return (
    <section className="mt-6" aria-label={title}>
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="text-base font-bold">{title}</h2>
        <Link to={more} className="flex items-center text-[13px] font-semibold text-tx-2" aria-label={`${title} 전체 보기`}>
          전체 보기
          <ChevronRight size={16} aria-hidden />
        </Link>
      </div>
      {children}
    </section>
  );
}

/** ⑨ 홈 요약 — 로그인 직후 첫 화면. 내 신고 진행 상태 → 새로 도착한 매칭 후보 → 최근 등록된 습득물 */
export function HomePage() {
  const { user, logout } = useAuth();
  const res = useAsync((signal) => homeApi.summary(signal), []);

  return (
    <>
      <AppBar
        title="홈"
        actions={
          <>
          {user?.role === 'TEACHER' && (
            <Link
              to="/admin"
              aria-label="관리자 화면"
              className="flex size-9 items-center justify-center rounded-field bg-accent-weak text-accent md:hidden"
            >
              <ShieldCheck size={18} aria-hidden />
            </Link>
          )}
          <button
            type="button"
            onClick={() => void logout()}
            aria-label="로그아웃"
            className="flex size-9 items-center justify-center rounded-field bg-bg-2 text-tx-2 md:hidden"
          >
            <LogOut size={18} aria-hidden />
          </button>
          </>
        }
      />
      <div className="px-4 pb-8 pt-4">
        <div className="md:hidden">
          <Logo className="text-[22px]" />
        </div>
        <p className="mt-1 text-[15px] font-semibold">{user?.name}님, 안녕하세요</p>

        {res.status === 'loading' && (
          <LoadingBlock label="요약을 불러오는 중" />
        )}
        {res.status === 'error' && (
          <StateView kind="error" title="요약을 불러오지 못했습니다" action={<Button onClick={res.retry}>다시 시도</Button>} />
        )}

        {res.status === 'ready' && (
          <>
            {res.data.pendingClaims !== null && (
              <Link
                to="/admin"
                className="mt-4 flex items-center gap-3 rounded-card bg-accent px-4 py-4 text-bg-1"
                aria-label={`승인 대기 ${res.data.pendingClaims}건 — 관리자 화면으로`}
              >
                <ClipboardCheck size={26} aria-hidden />
                <span className="flex-1">
                  <span className="block text-[13px] opacity-90">수령 신청 승인 대기</span>
                  <span className="block text-xl font-extrabold">{res.data.pendingClaims}건</span>
                </span>
                <ChevronRight size={20} aria-hidden />
              </Link>
            )}

            {res.data.isNewUser ? (
              <section className="mt-5" aria-label="시작하기">
                <p className="text-sm text-tx-2">아직 올린 신고가 없어요. 무엇을 할까요?</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Link to="/lost/new" className="flex flex-col gap-2 rounded-card border border-line bg-bg-1 p-4 font-bold">
                    <PackageSearch className="text-accent" size={26} aria-hidden />
                    분실 신고 작성
                  </Link>
                  <Link to="/found/new" className="flex flex-col gap-2 rounded-card border border-line bg-bg-1 p-4 font-bold">
                    <HandHeart className="text-accent" size={26} aria-hidden />
                    습득물 등록
                  </Link>
                </div>
              </section>
            ) : (
              <Section title="내 신고 진행 상태" more="/me/reports">
                <ul className="flex flex-col gap-2">
                  {res.data.myReports.map((r) => (
                    <li key={`${r.kind}-${r.id}`}>
                      <Link
                        to={r.kind === 'lost' ? `/matches?lostReportId=${r.id}` : `/found/${r.id}`}
                        className="flex items-center gap-3 rounded-card border border-line bg-bg-1 px-4 py-3"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="text-[11px] font-bold text-tx-3">{r.kind === 'lost' ? '분실 신고' : '습득 등록'}</span>
                          <span className="block truncate font-bold">{r.title}</span>
                          {r.kind === 'lost' && (r.candidateCount ?? 0) > 0 && (
                            <span className="text-xs font-semibold text-st-check">후보 {r.candidateCount}개</span>
                          )}
                        </span>
                        {r.kind === 'lost' ? (
                          <LostStatusBadge status={r.status as LostReportStatus} />
                        ) : (
                          <FoundStatusBadge status={r.status as FoundItemStatus} />
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {res.data.newMatches.length > 0 && (
              <Section title="새로 도착한 매칭 후보" more={`/matches?lostReportId=${res.data.newMatches[0].lostReportId}`}>
                <ul className="flex flex-col gap-2">
                  {res.data.newMatches.map((m) => (
                    <li key={m.lostReportId}>
                      <Link
                        to={`/matches?lostReportId=${m.lostReportId}`}
                        className="flex items-center gap-3 rounded-card border border-line bg-bg-1 p-3"
                      >
                        <span className="size-14 shrink-0 overflow-hidden rounded-field bg-bg-3">
                          {m.candidate.item.thumbnail ? (
                            <img src={m.candidate.item.thumbnail.url} alt="" className="size-full object-cover" />
                          ) : (
                            <ImageOff className="m-4 text-tx-3" size={22} aria-hidden />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-bold">{m.candidate.item.title}</span>
                          <span className="block truncate text-xs text-tx-2">'{m.lostReportTitle}' 신고의 후보</span>
                        </span>
                        <span className="text-sm font-extrabold text-accent">{Math.round(m.candidate.score * 100)}%</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Section title="최근 등록된 습득물" more="/found">
              <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2" aria-label="최근 습득물 목록">
                {res.data.recentFound.map((item) => (
                  <li key={item.id} className="w-40 shrink-0 snap-start md:w-48">
                    <FoundCard item={item} />
                  </li>
                ))}
              </ul>
            </Section>
          </>
        )}
      </div>
    </>
  );
}
