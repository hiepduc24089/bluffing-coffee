import { Link } from 'react-router-dom';
import { Empty, Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { clockQueryKeys, getClockGameFormats } from '@/main/modules/clock/api/clock.api';
import { formatChips, formatDuration } from '@/main/modules/clock/utils/clock.util';

export function ClockIndexPage() {
  const { data: gameFormats = [], isLoading } = useQuery({
    queryKey: clockQueryKeys.all,
    queryFn: getClockGameFormats,
  });

  return (
    <div className="min-h-screen bg-slate-950 px-[5vw] py-[6vh] text-white">
      <header className="mb-[4vh]">
        <h1 className="text-[clamp(1.6rem,4vw,3rem)] font-bold">Đồng hồ giải đấu</h1>
        <p className="text-[clamp(0.85rem,1.8vw,1.2rem)] text-slate-400">
          Chọn chế độ chơi để mở màn hình đếm giờ và hiển thị blind.
        </p>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spin size="large" />
        </div>
      ) : gameFormats.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {gameFormats.map((gameFormat) => (
            <Link
              key={gameFormat.id}
              to={`/clock/${gameFormat.code}`}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-emerald-400/60 hover:bg-white/10"
            >
              <span className="block text-[clamp(1.1rem,2.4vw,1.6rem)] font-semibold text-white">
                {gameFormat.name}
              </span>
              <span className="mt-1 block text-sm text-slate-400">{gameFormat.code}</span>
              <span className="mt-4 block text-sm text-slate-300">
                Stack {formatChips(gameFormat.startingStack)} · {gameFormat.levelCount} level ·{' '}
                {gameFormat.breakCount} break
              </span>
              <span className="mt-1 block text-sm text-slate-400">
                Ước tính {formatDuration(gameFormat.totalDurationMinutes)}
                {gameFormat.lateRegUntilLevel
                  ? ` · Late reg hết level ${gameFormat.lateRegUntilLevel}`
                  : ''}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<span className="text-slate-400">Chưa có chế độ chơi nào đang bật.</span>}
        />
      )}
    </div>
  );
}
