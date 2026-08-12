import { Link } from 'react-router-dom';
import { Empty, Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { clockQueryKeys, getClockTournamentTemplates } from '@/main/modules/clock/api/clock.api';
import { ClockBrandMark } from '@/main/modules/clock/components/clock-brand-mark';
import { ClockBrandTheme } from '@/main/modules/clock/components/clock-brand-theme';
import { formatChips, formatDuration } from '@/main/modules/clock/utils/clock.util';

export function ClockIndexPage() {
  const { data: tournamentTemplates = [], isLoading } = useQuery({
    queryKey: clockQueryKeys.all,
    queryFn: getClockTournamentTemplates,
  });

  return (
    <ClockBrandTheme>
      <div className="min-h-screen bg-ink px-[5vw] py-[6vh] text-white">
        <header className="mb-[4vh] flex flex-col gap-3">
          <ClockBrandMark withWordmark className="h-[clamp(2.5rem,6vw,5rem)] w-auto" />
          <div>
            <h1 className="text-[clamp(1.6rem,4vw,3rem)] font-bold text-brand">
              Đồng hồ giải đấu
            </h1>
            <p className="text-[clamp(0.85rem,1.8vw,1.2rem)] text-neutral-400">
              Chọn chế độ chơi để mở màn hình đếm giờ và hiển thị blind.
            </p>
          </div>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spin size="large" />
          </div>
        ) : tournamentTemplates.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {tournamentTemplates.map((tournamentTemplate) => (
              <Link
                key={tournamentTemplate.id}
                to={`/clock/${tournamentTemplate.code}`}
                className="rounded-2xl border border-brand/20 bg-brand/5 p-5 transition hover:border-brand/70 hover:bg-brand/10"
              >
                <span className="block text-[clamp(1.1rem,2.4vw,1.6rem)] font-semibold text-brand">
                  {tournamentTemplate.name}
                </span>
                <span className="mt-1 block text-sm text-neutral-500">{tournamentTemplate.code}</span>
                <span className="mt-4 block text-sm text-neutral-300">
                  Stack {formatChips(tournamentTemplate.startingStack)} · {tournamentTemplate.levelCount} level ·{' '}
                  {tournamentTemplate.breakCount} break
                </span>
                <span className="mt-1 block text-sm text-neutral-400">
                  Ước tính {formatDuration(tournamentTemplate.totalDurationMinutes)}
                  {tournamentTemplate.lateRegUntilLevel
                    ? ` · Late reg hết level ${tournamentTemplate.lateRegUntilLevel}`
                    : ''}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span className="text-neutral-400">Chưa có chế độ chơi nào đang bật.</span>
            }
          />
        )}
      </div>
    </ClockBrandTheme>
  );
}
