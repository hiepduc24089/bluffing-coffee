import { useMemo, useState } from 'react';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import { Empty, Typography } from 'antd';
import AppModal from '@/shared/components/atoms/AppModal';
import AppTextField from '@/shared/components/atoms/AppTextField';
import type { TournamentRegistrationRow } from '@/admin/modules/tournament/types/tournament.type';

type LiveSeatPlayerModalProps = {
  open: boolean;
  seatNumber?: number;
  registrations: TournamentRegistrationRow[];
  submitting?: boolean;
  onSelect: (registrationId: number) => void;
  onClose: () => void;
};

function getName(registration: TournamentRegistrationRow) {
  return registration.user?.name ?? `Người chơi #${registration.userId}`;
}

function getMeta(registration: TournamentRegistrationRow) {
  return registration.user?.phone ?? `Đăng ký #${registration.id}`;
}

export function LiveSeatPlayerModal({
  open,
  seatNumber,
  registrations,
  submitting,
  onSelect,
  onClose,
}: LiveSeatPlayerModalProps) {
  const [keyword, setKeyword] = useState('');

  const filteredRegistrations = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return registrations;

    return registrations.filter((registration) =>
      `${getName(registration)} ${getMeta(registration)}`.toLowerCase().includes(normalized),
    );
  }, [keyword, registrations]);

  return (
    <AppModal
      isOpen={open}
      onClose={onClose}
      afterOpenChange={(isOpen) => {
        if (!isOpen) setKeyword('');
      }}
      title={seatNumber ? `Chọn người chơi cho ghế ${seatNumber}` : 'Chọn người chơi'}
      maxWidth="max-w-lg"
      footer={null}
    >
      <div className="live-seat-picker">
        <AppTextField
          placeholder="Tìm theo tên hoặc số điện thoại"
          allowClear
          prefix={<SearchOutlined />}
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />

        {filteredRegistrations.length ? (
          <div className="live-seat-picker__list">
            {filteredRegistrations.map((registration) => (
              <button
                key={registration.id}
                type="button"
                className="live-seat-picker__item"
                disabled={submitting}
                onClick={() => onSelect(registration.id)}
              >
                <span className="live-player-chip__avatar">
                  <UserOutlined />
                </span>
                <span className="live-player-chip__content">
                  <strong>{getName(registration)}</strong>
                  <small>{getMeta(registration)}</small>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Typography.Text type="secondary">
                {registrations.length ? 'Không tìm thấy người chơi phù hợp' : 'Không còn người chờ xếp bàn'}
              </Typography.Text>
            }
          />
        )}
      </div>
    </AppModal>
  );
}
