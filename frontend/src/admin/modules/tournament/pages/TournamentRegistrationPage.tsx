import { useMemo, useState } from 'react';
import { DeleteOutlined, GiftOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { Card, message, Popconfirm, Space, Tag, Tooltip, Typography } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import AppButton from '@/shared/components/atoms/AppButton';
import AppInputNumber from '@/shared/components/atoms/AppInputNumber';
import AppSelect from '@/shared/components/atoms/AppSelect';
import AppTable from '@/shared/components/atoms/AppTable';
import { PageHeader } from '@/shared/components/layout/page-header';
import { getUserList, userQueryKeys } from '@/admin/modules/user/api/user.api';
import {
  createTournamentRegistration,
  deleteTournamentRegistration,
  finalizeTournamentRewards,
  getTournamentList,
  getTournamentRegistrations,
  tournamentQueryKeys,
  updateTournamentRegistration,
} from '@/admin/modules/tournament/api/tournament.api';
import type {
  TournamentRegistrationRow,
  TournamentRegistrationStatus,
  TournamentRow,
} from '@/admin/modules/tournament/types/tournament.type';

const statusLabels: Record<TournamentRegistrationStatus, string> = {
  registered: 'Đã đăng ký',
  finished: 'Đã hoàn tất',
  cancelled: 'Đã hủy',
};

const statusColors: Record<TournamentRegistrationStatus, string> = {
  registered: 'blue',
  finished: 'green',
  cancelled: 'default',
};

export function TournamentRegistrationPage() {
  const queryClient = useQueryClient();
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>();
  const [selectedUserId, setSelectedUserId] = useState<number>();
  const [draftPositions, setDraftPositions] = useState<Record<number, number | null>>({});
  const [draftStatuses, setDraftStatuses] = useState<Record<number, TournamentRegistrationStatus>>({});

  const { data: tournaments } = useQuery({
    queryKey: tournamentQueryKeys.list({ keyword: '', page: 1, perPage: 100 }),
    queryFn: () => getTournamentList({ keyword: '', page: 1, perPage: 100 }),
  });

  const { data: users } = useQuery({
    queryKey: userQueryKeys.list({ keyword: '', page: 1, perPage: 100 }),
    queryFn: () => getUserList({ keyword: '', page: 1, perPage: 100 }),
  });

  const registrationsQueryKey = ['tournament-registrations', selectedTournamentId] as const;

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: registrationsQueryKey,
    queryFn: () => getTournamentRegistrations(selectedTournamentId as string),
    enabled: Boolean(selectedTournamentId),
  });

  const selectedTournament = useMemo(
    () => tournaments?.data.find((tournament) => tournament.id === selectedTournamentId),
    [selectedTournamentId, tournaments?.data],
  );

  const registeredUserIds = useMemo(
    () => new Set(registrations.map((registration) => registration.userId)),
    [registrations],
  );

  const userOptions = useMemo(
    () =>
      (users?.data ?? [])
        .filter((user) => !registeredUserIds.has(Number(user.id)))
        .map((user) => {
          const label = `${user.name} - ${user.phone}`;

          return {
            label,
            searchText: label,
            value: Number(user.id),
          };
        }),
    [registeredUserIds, users?.data],
  );

  const invalidateRegistrations = async () => {
    await queryClient.invalidateQueries({ queryKey: registrationsQueryKey });
  };

  const createMutation = useMutation({
    mutationFn: () => createTournamentRegistration(selectedTournamentId as string, selectedUserId as number),
    onSuccess: async () => {
      message.success('Đã đăng ký thành viên vào giải đấu.');
      setSelectedUserId(undefined);
      await invalidateRegistrations();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      registration,
      finalPosition,
      status,
    }: {
      registration: TournamentRegistrationRow;
      finalPosition?: number | null;
      status?: TournamentRegistrationStatus;
    }) =>
      updateTournamentRegistration(registration.id, {
        finalPosition,
        status,
      }),
    onSuccess: async () => {
      message.success('Đã cập nhật đăng ký.');
      await invalidateRegistrations();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTournamentRegistration,
    onSuccess: async () => {
      message.success('Đã xóa đăng ký.');
      await invalidateRegistrations();
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: () => finalizeTournamentRewards(selectedTournamentId as string),
    onSuccess: async () => {
      message.success('Đã finalize và cộng BP theo reward profile.');
      await invalidateRegistrations();
      await queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.all });
    },
  });

  const columns: ColumnsType<TournamentRegistrationRow> = [
    {
      title: 'Thành viên',
      key: 'member',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span>{record.user?.name ?? '-'}</span>
          <Typography.Text type="secondary">{record.user?.phone ?? ''}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'BP',
      key: 'bp',
      align: 'right',
      render: (_, record) => (record.user?.bpBalance ?? 0).toLocaleString('vi-VN'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 190,
      render: (status: TournamentRegistrationStatus, record) => (
        <AppSelect
          value={draftStatuses[record.id] ?? status}
          options={[
            { label: 'Đã đăng ký', value: 'registered' },
            { label: 'Đã hoàn tất', value: 'finished' },
            { label: 'Đã hủy', value: 'cancelled' },
          ]}
          onChange={(value) =>
            setDraftStatuses((current) => ({
              ...current,
              [record.id]: value as TournamentRegistrationStatus,
            }))
          }
        />
      ),
    },
    {
      title: 'Vị trí',
      dataIndex: 'finalPosition',
      key: 'finalPosition',
      width: 130,
      render: (value: number | null, record) => (
        <AppInputNumber
          className="w-full"
          min={1}
          precision={0}
          placeholder="-"
          value={draftPositions[record.id] ?? value ?? null}
          onChange={(nextValue) =>
            setDraftPositions((current) => ({
              ...current,
              [record.id]: typeof nextValue === 'number' ? nextValue : null,
            }))
          }
        />
      ),
    },
    {
      title: 'Kết quả',
      key: 'result',
      render: (_, record) =>
        record.finalPosition ? (
          <Tag color={statusColors[record.status]}>
            #{record.finalPosition} - {statusLabels[record.status]}
          </Tag>
        ) : (
          <Tag color={statusColors[record.status]}>{statusLabels[record.status]}</Tag>
        ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size={8}>
          <Tooltip title="Lưu">
            <AppButton
              icon={<SaveOutlined />}
              loading={updateMutation.isPending}
              onClick={() =>
                updateMutation.mutate({
                  registration: record,
                  finalPosition:
                    record.id in draftPositions ? draftPositions[record.id] : record.finalPosition,
                  status: draftStatuses[record.id] ?? record.status,
                })
              }
            />
          </Tooltip>
          <Popconfirm
            title="Xóa đăng ký"
            description="Thành viên này sẽ bị xóa khỏi danh sách giải đấu."
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Tooltip title="Xóa">
              <AppButton danger icon={<DeleteOutlined />} loading={deleteMutation.isPending} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const canRegister = Boolean(selectedTournamentId && selectedUserId);

  return (
    <div className="page-stack">
      <PageHeader
        title="Đăng ký giải đấu"
        subtitle="Thêm thành viên vào giải đấu và cập nhật kết quả sau khi chơi."
      />

      <Card>
        <Space wrap size={12} className="toolbar">
          <AppSelect
            showSearch
            placeholder="Chọn giải đấu"
            style={{ minWidth: 300 }}
            value={selectedTournamentId}
            optionFilterProp="searchText"
            options={(tournaments?.data ?? []).map((tournament: TournamentRow) => {
              const startAt = dayjs(tournament.startAt).format('HH:mm DD/MM/YYYY');
              const label = `${tournament.name} - ${startAt}`;

              return {
                label,
                searchText: label,
                value: tournament.id,
              };
            })}
            onChange={(value) => {
              setSelectedTournamentId(value as string | undefined);
              setSelectedUserId(undefined);
              setDraftPositions({});
              setDraftStatuses({});
            }}
          />

          <AppSelect
            showSearch
            placeholder="Chọn thành viên"
            style={{ minWidth: 280 }}
            disabled={!selectedTournamentId}
            value={selectedUserId}
            optionFilterProp="searchText"
            options={userOptions}
            onChange={(value) => setSelectedUserId(value as number)}
          />

          <AppButton
            type="primary"
            icon={<PlusOutlined />}
            disabled={!canRegister}
            loading={createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            Đăng ký
          </AppButton>

          <Popconfirm
            title="Finalize rewards"
            description="Hệ thống sẽ cộng BP theo vị trí đã nhập và reward profile của giải đấu."
            okText="Finalize"
            cancelText="Hủy"
            onConfirm={() => finalizeMutation.mutate()}
            disabled={!selectedTournamentId}
          >
            <AppButton
              icon={<GiftOutlined />}
              disabled={!selectedTournamentId}
              loading={finalizeMutation.isPending}
            >
              Finalize rewards
            </AppButton>
          </Popconfirm>
        </Space>

        {selectedTournament ? (
          <div className="mb-4">
            <Tag color="blue">{selectedTournament.status}</Tag>
            <span>{selectedTournament.name}</span>
          </div>
        ) : null}

        <AppTable<TournamentRegistrationRow>
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={selectedTournamentId ? registrations : []}
          pagination={false}
        />
      </Card>
    </div>
  );
}
