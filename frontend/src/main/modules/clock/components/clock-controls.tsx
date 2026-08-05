import {
  FullscreenExitOutlined,
  FullscreenOutlined,
  MinusOutlined,
  PauseOutlined,
  PlayCircleFilled,
  PlusOutlined,
  ReloadOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
} from '@ant-design/icons';
import { Popconfirm } from 'antd';
import AppButton from '@/shared/components/atoms/AppButton';

const GHOST_BUTTON =
  '!h-12 !min-w-12 !rounded-xl !border-white/20 !bg-white/10 !text-white hover:!border-white/40 hover:!bg-white/20 hover:!text-white';

type ClockControlsProps = {
  isRunning: boolean;
  isFullscreen: boolean;
  onToggle: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onAddMinutes: (minutes: number) => void;
  onReset: () => void;
  onToggleFullscreen: () => void;
};

export function ClockControls({
  isRunning,
  isFullscreen,
  onToggle,
  onPrevious,
  onNext,
  onAddMinutes,
  onReset,
  onToggleFullscreen,
}: ClockControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      <AppButton
        className={GHOST_BUTTON}
        icon={<StepBackwardOutlined />}
        onClick={onPrevious}
        title="Level trước"
      />

      <AppButton
        className="!h-14 !rounded-xl !border-none !bg-emerald-500 !px-8 !text-base !font-semibold !text-white hover:!bg-emerald-400"
        icon={isRunning ? <PauseOutlined /> : <PlayCircleFilled />}
        onClick={onToggle}
      >
        {isRunning ? 'Tạm dừng' : 'Bắt đầu'}
      </AppButton>

      <AppButton
        className={GHOST_BUTTON}
        icon={<StepForwardOutlined />}
        onClick={onNext}
        title="Level sau"
      />

      <AppButton
        className={GHOST_BUTTON}
        icon={<PlusOutlined />}
        onClick={() => onAddMinutes(1)}
        title="Thêm 1 phút"
      >
        1 phút
      </AppButton>

      <AppButton
        className={GHOST_BUTTON}
        icon={<MinusOutlined />}
        onClick={() => onAddMinutes(-1)}
        title="Bớt 1 phút"
      >
        1 phút
      </AppButton>

      <Popconfirm
        title="Đặt lại đồng hồ"
        description="Quay về level 1 và dừng đếm giờ."
        okText="Đặt lại"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
        onConfirm={onReset}
      >
        <AppButton className={GHOST_BUTTON} icon={<ReloadOutlined />} title="Đặt lại" />
      </Popconfirm>

      <AppButton
        className={GHOST_BUTTON}
        icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
        onClick={onToggleFullscreen}
        title="Toàn màn hình"
      />
    </div>
  );
}
