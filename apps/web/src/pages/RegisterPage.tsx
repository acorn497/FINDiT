import { ChevronRight, PackageSearch, HandHeart } from 'lucide-react';
import { Link } from 'react-router';
import { AppBar } from '../shared/layout/AppBar';

const CHOICES = [
  {
    to: '/lost/new',
    icon: PackageSearch,
    title: '분실 신고 작성',
    description: '잃어버린 물건을 알려 주세요. 비슷한 습득물을 후보로 보여 드려요.',
  },
  {
    to: '/found/new',
    icon: HandHeart,
    title: '습득물 등록',
    description: '주운 물건을 사진과 함께 등록하고 맡긴 장소를 알려 주세요.',
  },
];

/** 하단 탭 [등록] — 분실 신고와 습득물 등록 중 고른다. */
export function RegisterPage() {
  return (
    <>
      <AppBar title="등록하기" />
      <section className="grid gap-3 px-4 py-5 md:grid-cols-2">
        {CHOICES.map(({ to, icon: Icon, title, description }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-4 rounded-card border border-line bg-bg-1 p-5 transition-colors hover:border-accent"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-card bg-accent-weak text-accent">
              <Icon size={24} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-bold">{title}</span>
              <span className="mt-1 block text-[13px] leading-relaxed text-tx-2">{description}</span>
            </span>
            <ChevronRight size={20} className="text-tx-3" aria-hidden />
          </Link>
        ))}
      </section>
    </>
  );
}
