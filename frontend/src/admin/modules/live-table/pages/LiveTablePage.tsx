import { useEffect, useMemo, useState } from 'react';
import { DeleteOutlined, FireOutlined, HistoryOutlined, ReloadOutlined, UserOutlined } from '@ant-design/icons';
import { Card, Empty, Popconfirm, Space, Spin, Tag, Tooltip, Typography } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate, useParams } from 'react-router-dom';
import AppButton from '@/shared/components/atoms/AppButton';
import AppSelect from '@/shared/components/atoms/AppSelect';
import { PageHeader } from '@/shared/components/layout/page-header';
import {
  clearLiveTableSeat,
  eliminateLiveTableSeat,
  getLiveTableState,
  getTodayLiveTableTournaments,
  liveTableQueryKeys,
  moveLiveTableSeat,
  rebuyLiveTablePlayer,
  selectLiveTableTournament,
} from '@/admin/modules/live-table/api/live-table.api';
import type {
  LiveTableKey,
  LiveTableSeat,
  LiveTableState,
  TournamentLiveEvent,
} from '@/admin/modules/live-table/types/live-table.type';
import type { TournamentRegistrationRow } from '@/admin/modules/tournament/types/tournament.type';
import { useAppToast } from '@/shared/hooks/use-app-toast';

const tableLabels: Record<LiveTableKey, string> = {
  green: 'Bàn Xanh Lá',
  red: 'Bàn Đỏ',
  blue: 'Bàn Xanh Dương',
};

const seatNumbers = Array.from({ length: 9 }, (_, index) => index + 1);

const eventLabels: Record<string, string> = {
  table_selected: 'Chọn giải đấu',
  seat_assigned: 'Xếp ghế',
  seat_moved: 'Chuyển ghế',
  seat_swapped: 'Đổi ghế',
  seat_cleared: 'Bỏ khỏi ghế',
  player_eliminated: 'Cháy',
  player_rebuy: 'Re-buy',
};

function isLiveTableKey(value: string | undefined): value is LiveTableKey {
  return value === 'green' || value === 'red' || value === 'blue';
}

function getRegistrationName(registration?: TournamentRegistrationRow) {
  return registration?.user?.name ?? `Người chơi #${registration?.userId ?? '-'}`;
}

function getRegistrationMeta(registration?: TournamentRegistrationRow) {
  return registration?.user?.phone ?? `Đăng ký #${registration?.id ?? '-'}`;
}

function PlayerChip({
  registration,
  draggable = true,
}: {
  registration: TournamentRegistrationRow;
  draggable?: boolean;
}) {
  return (
    <div
      className="live-player-chip"
      draggable={draggable}
      onDragStart={(event) => {
        event.dataTransfer.setData('application/x-registration-id', String(registration.id));
        event.dataTransfer.effectAllowed = 'move';
      }}
    >
      <span className="live-player-chip__avatar">
        <UserOutlined />
      </span>
      <span className="live-player-chip__content">
        <strong>{getRegistrationName(registration)}</strong>
        <small>{getRegistrationMeta(registration)}</small>
      </span>
    </div>
  );
}

function LiveSeat({
  seatNumber,
  seat,
  disabled,
  onDropRegistration,
  onClear,
  onEliminate,
}: {
  seatNumber: number;
  seat?: LiveTableSeat;
  disabled?: boolean;
  onDropRegistration: (registrationId: number, seatNumber: number) => void;
  onClear: (seatNumber: number) => void;
  onEliminate: (seatNumber: number) => void;
}) {
  const registration = seat?.registration;

  return (
    <div
      className={`live-seat live-seat--${seatNumber} ${registration ? 'live-seat--occupied' : ''}`}
      onDragOver={(event) => {
        if (disabled) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(event) => {
        if (disabled) return;
        event.preventDefault();
        const registrationId = Number(event.dataTransfer.getData('application/x-registration-id'));
        if (registrationId) onDropRegistration(registrationId, seatNumber);
      }}
    >
      <div className="live-seat__number">{seatNumber}</div>
      {registration ? (
        <>
          <PlayerChip registration={registration} />
          <div className="live-seat__actions">
            <Popconfirm
              title="Đánh dấu người chơi cháy?"
              okText="Cháy"
              cancelText="Hủy"
              onConfirm={() => onEliminate(seatNumber)}
            >
              <Tooltip title="Cháy">
                <AppButton size="small" danger icon={<FireOutlined />} />
              </Tooltip>
            </Popconfirm>
            <Popconfirm
              title="Bỏ người chơi khỏi ghế?"
              okText="Bỏ ghế"
              cancelText="Hủy"
              onConfirm={() => onClear(seatNumber)}
            >
              <Tooltip title="Bỏ khỏi ghế">
                <AppButton size="small" icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          </div>
        </>
      ) : (
        <span className="live-seat__empty">Trống</span>
      )}
    </div>
  );
}

function describeEvent(event: TournamentLiveEvent) {
  const playerName = event.user?.name ?? 'Hệ thống';
  const fromSeat = event.fromSeatNumber ? `ghế ${event.fromSeatNumber}` : null;
  const toSeat = event.toSeatNumber ? `ghế ${event.toSeatNumber}` : null;

  if (fromSeat && toSeat) return `${playerName}: ${fromSeat} -> ${toSeat}`;
  if (toSeat) return `${playerName}: vào ${toSeat}`;
  if (fromSeat) return `${playerName}: rời ${fromSeat}`;

  return playerName;
}

export function LiveTablePage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const toast = useAppToast();
  const routeTableKey = params.tableKey;
  const tableKey: LiveTableKey = isLiveTableKey(routeTableKey) ? routeTableKey : 'green';
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>();

  const todayTournamentsQuery = useQuery({
    queryKey: liveTableQueryKeys.todayTournaments,
    queryFn: getTodayLiveTableTournaments,
  });

  const stateQuery = useQuery({
    queryKey: liveTableQueryKeys.detail(tableKey, selectedTournamentId),
    queryFn: () => getLiveTableState(tableKey, selectedTournamentId),
  });

  useEffect(() => {
    const currentTournamentId = stateQuery.data?.table.currentTournamentId;
    if (!selectedTournamentId && currentTournamentId) {
      setSelectedTournamentId(currentTournamentId);
    }
  }, [selectedTournamentId, stateQuery.data?.table.currentTournamentId]);

  const selectedTournament = useMemo(
    () => todayTournamentsQuery.data?.find((tournament) => tournament.id === selectedTournamentId),
    [selectedTournamentId, todayTournamentsQuery.data],
  );

  const state = stateQuery.data;
  const seatsByNumber = useMemo(
    () =>
      (state?.seats ?? []).reduce<Record<number, LiveTableSeat>>((current, seat) => {
        current[seat.seatNumber] = seat;
        return current;
      }, {}),
    [state?.seats],
  );

  const setStateCache = (nextState: LiveTableState) => {
    queryClient.setQueryData(liveTableQueryKeys.detail(tableKey, nextState.tournament?.id), nextState);
    queryClient.setQueryData(liveTableQueryKeys.detail(tableKey, selectedTournamentId), nextState);
  };

  const invalidateState = async () => {
    await queryClient.invalidateQueries({ queryKey: liveTableQueryKeys.all });
  };

  const selectTournamentMutation = useMutation({
    mutationFn: (tournamentId: string) => selectLiveTableTournament(tableKey, tournamentId),
    onSuccess: (nextState) => {
      setSelectedTournamentId(nextState.tournament?.id);
      setStateCache(nextState);
      toast.success('Đã chọn giải đấu cho bàn.');
    },
  });

  const moveMutation = useMutation({
    mutationFn: ({
      tournamentRegistrationId,
      toSeatNumber,
    }: {
      tournamentRegistrationId: number;
      toSeatNumber: number;
    }) =>
      moveLiveTableSeat(tableKey, {
        tournamentId: selectedTournamentId as string,
        tournamentRegistrationId,
        toSeatNumber,
      }),
    onSuccess: (nextState) => {
      setStateCache(nextState);
      toast.success('Đã cập nhật ghế.');
    },
  });

  const clearMutation = useMutation({
    mutationFn: (seatNumber: number) => clearLiveTableSeat(tableKey, selectedTournamentId as string, seatNumber),
    onSuccess: (nextState) => {
      setStateCache(nextState);
      toast.success('Đã bỏ người chơi khỏi ghế.');
    },
  });

  const eliminateMutation = useMutation({
    mutationFn: (seatNumber: number) =>
      eliminateLiveTableSeat(tableKey, selectedTournamentId as string, seatNumber),
    onSuccess: (nextState) => {
      setStateCache(nextState);
      toast.success('Đã đưa người chơi vào list cháy.');
    },
  });

  const rebuyMutation = useMutation({
    mutationFn: (registrationId: number) => rebuyLiveTablePlayer(selectedTournamentId as string, registrationId),
    onSuccess: async () => {
      toast.success('Đã re-buy người chơi.');
      await invalidateState();
    },
  });

  const isBusy =
    selectTournamentMutation.isPending ||
    moveMutation.isPending ||
    clearMutation.isPending ||
    eliminateMutation.isPending ||
    rebuyMutation.isPending;
  const hasTournament = Boolean(selectedTournamentId || state?.tournament);

  if (!isLiveTableKey(routeTableKey)) {
    return <Navigate to="/admin/live-tables/green" replace />;
  }

  return (
    <div className="page-stack">
      <PageHeader
        title={tableLabels[tableKey]}
        subtitle="Xếp người chơi vào bàn live, swap ghế, xử lý cháy và re-buy trong tournament."
        extra={
          <AppButton
            icon={<ReloadOutlined />}
            onClick={() => invalidateState()}
            loading={stateQuery.isFetching || todayTournamentsQuery.isFetching}
          >
            Tải lại
          </AppButton>
        }
      />

      <Card>
        <Space wrap size={12} className="toolbar">
          <AppSelect
            className="live-table-tournament-select"
            placeholder="Chọn giải đấu hôm nay"
            loading={todayTournamentsQuery.isLoading}
            value={selectedTournamentId}
            onChange={(value) => {
              const tournamentId = value as string;
              setSelectedTournamentId(tournamentId);
              selectTournamentMutation.mutate(tournamentId);
            }}
            options={(todayTournamentsQuery.data ?? []).map((tournament) => ({
              label: `${tournament.name} - ${tournament.startAt}`,
              value: tournament.id,
            }))}
          />
          {selectedTournament ? (
            <Tag color="blue">{selectedTournament.status}</Tag>
          ) : null}
        </Space>

        {stateQuery.isLoading ? (
          <div className="live-table-loading">
            <Spin />
          </div>
        ) : hasTournament ? (
          <div className="live-table-workspace">
            <section className="live-table-board-area">
              <div className={`live-poker-table live-poker-table--${tableKey}`}>
                <div className="live-poker-table__felt">
                  <div className="live-poker-table__dealer">Dealer</div>
                  <div className="live-poker-table__title">{state?.tournament?.name ?? selectedTournament?.name}</div>
                </div>

                {seatNumbers.map((seatNumber) => (
                  <LiveSeat
                    key={seatNumber}
                    seatNumber={seatNumber}
                    seat={seatsByNumber[seatNumber]}
                    disabled={!selectedTournamentId || isBusy}
                    onDropRegistration={(registrationId, toSeatNumber) =>
                      moveMutation.mutate({ tournamentRegistrationId: registrationId, toSeatNumber })
                    }
                    onClear={(targetSeatNumber) => clearMutation.mutate(targetSeatNumber)}
                    onEliminate={(targetSeatNumber) => eliminateMutation.mutate(targetSeatNumber)}
                  />
                ))}
              </div>
            </section>

            <aside className="live-table-sidebars">
              <Card title="Chưa xếp bàn" size="small">
                <div className="live-player-list">
                  {(state?.availableRegistrations ?? []).length > 0 ? (
                    state?.availableRegistrations.map((registration) => (
                      <PlayerChip key={registration.id} registration={registration} draggable={!isBusy} />
                    ))
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không còn người chờ xếp bàn" />
                  )}
                </div>
              </Card>

              <Card title="Cháy" size="small">
                <div className="live-player-list">
                  {(state?.eliminatedRegistrations ?? []).length > 0 ? (
                    state?.eliminatedRegistrations.map((registration) => (
                      <div key={registration.id} className="live-eliminated-row">
                        <PlayerChip registration={registration} draggable={false} />
                        <AppButton
                          size="small"
                          type="primary"
                          onClick={() => rebuyMutation.mutate(registration.id)}
                          loading={rebuyMutation.isPending}
                        >
                          Re-buy
                        </AppButton>
                      </div>
                    ))
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có người cháy" />
                  )}
                </div>
              </Card>
            </aside>
          </div>
        ) : (
          <Empty description="Chưa chọn giải đấu hôm nay cho bàn này" />
        )}
      </Card>

      <Card
        title={
          <Space>
            <HistoryOutlined />
            Lịch sử live tournament
          </Space>
        }
      >
        {(state?.events ?? []).length > 0 ? (
          <div className="live-event-list">
            {state?.events.map((event) => (
              <div key={event.id} className="live-event-row">
                <Tag>{eventLabels[event.eventType] ?? event.eventType}</Tag>
                <Typography.Text>{describeEvent(event)}</Typography.Text>
                <Typography.Text type="secondary">{event.createdAt}</Typography.Text>
              </div>
            ))}
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có lịch sử" />
        )}
      </Card>
    </div>
  );
}
