import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Result, Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import AppButton from '@/shared/components/atoms/AppButton';
import { clockQueryKeys, getClockGameFormat } from '@/main/modules/clock/api/clock.api';
import { ClockControls } from '@/main/modules/clock/components/clock-controls';
import { ClockDisplay } from '@/main/modules/clock/components/clock-display';
import { useControlsVisibility } from '@/main/modules/clock/hooks/use-controls-visibility';
import { useFullscreen } from '@/main/modules/clock/hooks/use-fullscreen';
import { useTournamentClock } from '@/main/modules/clock/hooks/use-tournament-clock';

export function ClockPage() {
  const { code = '' } = useParams<{ code: string }>();
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

  const { data: gameFormat, isLoading, isError } = useQuery({
    queryKey: clockQueryKeys.detail(code),
    queryFn: () => getClockGameFormat(code),
    enabled: Boolean(code),
  });

  const levels = useMemo(() => gameFormat?.levels ?? [], [gameFormat]);
  const clock = useTournamentClock(code, levels);
  const areControlsVisible = useControlsVisibility(clock.isRunning);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, [contenteditable="true"]')) return;

      if (event.code === 'Space') {
        event.preventDefault();
        clock.toggle();
        return;
      }

      if (event.key === 'ArrowRight') clock.goNext();
      if (event.key === 'ArrowLeft') clock.goPrevious();
      if (event.key === 'f' || event.key === 'F') void toggleFullscreen();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clock, toggleFullscreen]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Spin size="large" />
      </div>
    );
  }

  if (isError || !gameFormat || !levels.length) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <Result
          status="404"
          title={<span className="text-white">Không tìm thấy chế độ chơi</span>}
          subTitle={
            <span className="text-slate-400">
              Mã "{code}" không tồn tại, đang tắt, hoặc chưa có cấu trúc blind.
            </span>
          }
          extra={
            <Link to="/clock">
              <AppButton type="primary">Chọn chế độ chơi khác</AppButton>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col gap-[2vh] bg-slate-950 px-[4vw] py-[3vh] text-white">
      <ClockDisplay
        gameFormat={gameFormat}
        currentLevel={clock.currentLevel}
        nextLevel={clock.nextLevel}
        levelIndex={clock.levelIndex}
        remainingMs={clock.remainingMs}
        progress={clock.progress}
        isRunning={clock.isRunning}
      />

      <div
        className={`transition-opacity duration-500 ${
          areControlsVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <ClockControls
          isRunning={clock.isRunning}
          isFullscreen={isFullscreen}
          onToggle={clock.toggle}
          onPrevious={clock.goPrevious}
          onNext={clock.goNext}
          onAddMinutes={clock.addMinutes}
          onReset={clock.reset}
          onToggleFullscreen={() => void toggleFullscreen()}
        />
      </div>
    </div>
  );
}
