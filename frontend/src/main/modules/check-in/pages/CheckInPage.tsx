import { useMemo, useState } from 'react';
import { CheckCircleOutlined, CoffeeOutlined, ReloadOutlined, TrophyOutlined } from '@ant-design/icons';
import { Alert, Card, Empty, Modal, Radio, Space, Spin, Tag, Typography } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AppButton from '@/shared/components/atoms/AppButton';
import {
  checkInQueryKeys,
  checkInTournament,
  getCurrentCheckInRegistration,
  getTodayCheckInTournaments,
} from '@/main/modules/check-in/api/check-in.api';
import type {
  CheckInEntryType,
  CheckInRegistration,
  CheckInTournament,
} from '@/main/modules/check-in/types/check-in.type';

const formatCurrency = (value?: number | null) => `${(value ?? 0).toLocaleString('vi-VN')}đ`;

function getStatusLabel(status: CheckInTournament['status']) {
  return status === 'running' ? 'Đang diễn ra' : 'Đã mở';
}

export function CheckInPage() {
  const queryClient = useQueryClient();
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>();
  const [entryType, setEntryType] = useState<CheckInEntryType>('with_drink');
  const [registration, setRegistration] = useState<CheckInRegistration | null>(null);

  const tournamentsQuery = useQuery({
    queryKey: checkInQueryKeys.todayTournaments,
    queryFn: getTodayCheckInTournaments,
  });

  const currentRegistrationQuery = useQuery({
    queryKey: checkInQueryKeys.currentRegistration,
    queryFn: getCurrentCheckInRegistration,
  });

  const selectedTournament = useMemo(
    () => tournamentsQuery.data?.find((tournament) => tournament.id === selectedTournamentId),
    [selectedTournamentId, tournamentsQuery.data],
  );
  const currentRegistration = registration ?? currentRegistrationQuery.data ?? null;
  const currentTournamentName = currentRegistration?.tournament?.name ?? 'giải hiện tại';
  const isSelectedCurrentTournament = Boolean(
    selectedTournamentId && currentRegistration?.tournamentId === selectedTournamentId,
  );

  const checkInMutation = useMutation({
    mutationFn: () =>
      checkInTournament({
        tournamentId: selectedTournamentId as string,
        entryType,
      }),
    onSuccess: (nextRegistration) => {
      setRegistration(nextRegistration);
      queryClient.invalidateQueries({ queryKey: checkInQueryKeys.todayTournaments });
      queryClient.invalidateQueries({ queryKey: checkInQueryKeys.currentRegistration });
    },
  });

  const submitCheckIn = () => {
    if (!selectedTournamentId) return;

    if (isSelectedCurrentTournament) return;

    if (currentRegistration && currentRegistration.tournamentId !== selectedTournamentId) {
      Modal.confirm({
        title: 'Rời giải đấu hiện tại?',
        content: `Bạn đang tham gia ${currentTournamentName}. Có chắc muốn rời giải đấu để tham gia ${selectedTournament?.name ?? 'giải này'} không?`,
        okText: 'Rời và tham gia',
        cancelText: 'Hủy',
        okButtonProps: { danger: true },
        onOk: () => checkInMutation.mutate(),
      });
      return;
    }

    checkInMutation.mutate();
  };

  return (
    <main className="check-in-screen">
      <section className="check-in-header">
        <Space direction="vertical" size={4}>
          <Typography.Text className="login-eyebrow">Bluffing Coffee</Typography.Text>
          <Typography.Title level={2}>Check-in giải đấu</Typography.Title>
          <Typography.Text type="secondary">
            Chọn giải đang mở hôm nay và xác nhận gói vé để tham gia.
          </Typography.Text>
        </Space>
        <AppButton
          icon={<ReloadOutlined />}
          onClick={() => tournamentsQuery.refetch()}
          loading={tournamentsQuery.isFetching}
        >
          Tải lại
        </AppButton>
      </section>

      {registration ? (
        <Alert
          className="check-in-success"
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          message="Check-in thành công"
          description={`Bạn đã tham gia ${registration.tournament?.name ?? 'giải đấu đã chọn'}.`}
        />
      ) : null}

      <section className="check-in-grid">
        <Card title="Giải đấu hôm nay">
          {tournamentsQuery.isLoading ? (
            <div className="check-in-loading">
              <Spin />
            </div>
          ) : (tournamentsQuery.data ?? []).length > 0 ? (
            <div className="check-in-tournament-list">
              {tournamentsQuery.data?.map((tournament) => {
                const selected = tournament.id === selectedTournamentId;
                const checkedIn = currentRegistration?.tournamentId === tournament.id;

                return (
                  <button
                    key={tournament.id}
                    type="button"
                    className={`check-in-tournament ${selected ? 'check-in-tournament--selected' : ''}`}
                    onClick={() => {
                      setSelectedTournamentId(tournament.id);
                      setRegistration(null);
                    }}
                  >
                    <span className="check-in-tournament__icon">
                      <TrophyOutlined />
                    </span>
                    <span className="check-in-tournament__content">
                      <strong>{tournament.name}</strong>
                      <small>{tournament.startAt}</small>
                    </span>
                    <Tag color={tournament.status === 'running' ? 'green' : 'blue'}>
                      {checkedIn ? 'Đang tham gia' : getStatusLabel(tournament.status)}
                    </Tag>
                  </button>
                );
              })}
            </div>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Hôm nay chưa có giải mở check-in" />
          )}
        </Card>

        <Card title="Xác nhận check-in">
          {selectedTournament ? (
            <Space direction="vertical" size={16} className="w-full">
              <Space direction="vertical" size={2}>
                <Typography.Text strong>{selectedTournament.name}</Typography.Text>
                <Typography.Text type="secondary">{selectedTournament.startAt}</Typography.Text>
              </Space>

              <Radio.Group
                className="check-in-entry-options"
                value={entryType}
                onChange={(event) => setEntryType(event.target.value)}
              >
                <Radio.Button value="with_drink">
                  <CoffeeOutlined /> Vé + đồ uống - {formatCurrency(selectedTournament.ticketPriceWithDrink)}
                </Radio.Button>
                <Radio.Button value="without_drink">
                  Vé nước lọc - {formatCurrency(selectedTournament.ticketPriceWithoutDrink)}
                </Radio.Button>
              </Radio.Group>

              <AppButton
                type="primary"
                size="large"
                block
                disabled={isSelectedCurrentTournament}
                loading={checkInMutation.isPending}
                onClick={submitCheckIn}
              >
                {isSelectedCurrentTournament ? 'Đã check-in giải này' : 'Check-in tham gia giải'}
              </AppButton>
            </Space>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chọn một giải đấu để check-in" />
          )}
        </Card>
      </section>
    </main>
  );
}
