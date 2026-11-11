import { WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

/** 인터넷 연결이 끊기면 화면 아래쪽에 계속 보이는 안내 (다시 연결되면 사라진다) */
export function OfflineBanner() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  if (online) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-20 z-[55] mx-auto flex w-fit items-center gap-2 rounded-chip bg-tx-1 px-4 py-2 text-[13px] font-semibold text-bg-1 shadow-lg md:bottom-6"
    >
      <WifiOff size={16} aria-hidden />
      인터넷 연결이 끊겼습니다. 연결되면 다시 시도해 주세요.
    </div>
  );
}
