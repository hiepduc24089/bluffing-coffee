import { useMemo, useState } from 'react';
import { DeleteOutlined, GiftOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { Card, Modal, Popconfirm, Space, Tag, Tooltip, Typography } from 'antd';
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
  getTournamentRewardPreview,
  getTournamentList,
  getTournamentRegistrations,
  tournamentQueryKeys,
  updateTournamentRegistration,
} from '@/admin/modules/tournament/api/tournament.api';
import type {
  TournamentRegistrationRow,
  TournamentRegistrationStatus,
  TournamentRewardPreviewRow,
  TournamentRow,
} from '@/admin/modules/tournament/types/tournament.type';
import { useAppToast } from '@/shared/hooks/use-app-toast';

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

const formatCurrency = (value?: number | null) => `${(value ?? 0).toLocaleString('vi-VN')}đ`;

export function TournamentRegistrationPage() {
  const queryClient = useQueryClient();
  const toast = useAppToast();
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>();
  const [selectedUserId, setSelectedUserId] = useState<number>();
  const [selectedEntryType, setSelectedEntryType] = useState<'with_drink' | 'without_drink'>();
  const [draftPositions, setDraftPositions] = useState<Record<number, number | null>>({});
  const [draftStatuses, setDraftStatuses] = useState<Record<number, TournamentRegistrationStatus>>({});
  const [previewOpen, setPreviewOpen] = useState(false);

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

  const rewardPreviewQuery = useQuery({
    queryKey: ['tournament-reward-preview', selectedTournamentId],
    queryFn: () => getTournamentRewardPreview(selectedTournamentId as string),
    enabled: Boolean(selectedTournamentId && previewOpen),
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
    mutationFn: () =>
      createTournamentRegistration(
        selectedTournamentId as string,
        selectedUserId as number,
        selectedEntryType as 'with_drink' | 'without_drink',
      ),
    onSuccess: async () => {
      toast.success('Đã đăng ký thành viên vào giải đấu.');
      setSelectedUserId(undefined);
      setSelectedEntryType(undefined);
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
      toast.success('Đã cập nhật đăng ký.');
      await invalidateRegistrations();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTournamentRegistration,
    onSuccess: async () => {
      toast.success('Đã xóa đăng ký.');
      await invalidateRegistrations();
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: () => finalizeTournamentRewards(selectedTournamentId as string),
    onSuccess: async () => {
      toast.success('Đã finalize và cộng BP theo mẫu cấu hình.');
      await invalidateRegistrations();
      await queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['tournament-reward-preview', selectedTournamentId] });
      setPreviewOpen(false);
    },
  });

  const previewColumns: ColumnsType<TournamentRewardPreviewRow> = [
    {
      title: 'Thành viên',
      key: 'member',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span>{record.userName ?? '-'}</span>
          <Typography.Text type="secondary">{record.phone ?? ''}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Vị trí',
      dataIndex: 'finalPosition',
      key: 'finalPosition',
      align: 'right',
      render: (value?: number | null) => value ?? '-',
    },
    {
      title: 'BP sẽ cộng',
      dataIndex: 'bpReward',
      key: 'bpReward',
      align: 'right',
      render: (value: number, record) => (record.willReward ? value.toLocaleString('vi-VN') : '-'),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, record) => {
        if (record.willReward) {
          return <Tag color="green">Sẽ cộng BP</Tag>;
        }

        if (record.alreadyRewarded) {
          return <Tag color="blue">Đã cộng trước đó</Tag>;
        }

        return <Tag>{record.note ?? 'Không cộng'}</Tag>;
      },
    },
  ];

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
      title: 'Gói vé',
      key: 'entryType',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span>
            {record.entryType === 'with_drink'
              ? 'Vé + 1 đồ uống pha + nước lọc'
              : 'Vé + nước lọc'}
          </span>
          <Typography.Text type="secondary">
            {formatCurrency(record.entryPrice)}
          </Typography.Text>
        </Space>
      ),
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

  const canRegister = Boolean(selectedTournamentId && selectedUserId && selectedEntryType);

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
              setSelectedEntryType(undefined);
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

          <AppSelect
            placeholder="Chọn gói vé"
            style={{ minWidth: 280 }}
            disabled={!selectedTournamentId}
            value={selectedEntryType}
            options={
              selectedTournament
                ? [
                    {
                      label: `Vé + 1 đồ uống pha + nước lọc - ${formatCurrency(selectedTournament.ticketPriceWithDrink)}`,
                      value: 'with_drink',
                    },
                    {
                      label: `Vé + nước lọc - ${formatCurrency(selectedTournament.ticketPriceWithoutDrink)}`,
                      value: 'without_drink',
                    },
                  ]
                : []
            }
            onChange={(value) => setSelectedEntryType(value as 'with_drink' | 'without_drink')}
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

          <AppButton
            icon={<GiftOutlined />}
            disabled={!selectedTournamentId}
            loading={finalizeMutation.isPending}
            onClick={() => setPreviewOpen(true)}
          >
            Preview finalize
          </AppButton>
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

      <Modal
        open={previewOpen}
        title="Preview finalize rewards"
        width={860}
        okText="Finalize và cộng BP"
        cancelText="Hủy"
        okButtonProps={{
          disabled: !rewardPreviewQuery.data?.some((row) => row.willReward),
          loading: finalizeMutation.isPending,
        }}
        onCancel={() => setPreviewOpen(false)}
        onOk={() => finalizeMutation.mutate()}
      >
        <Typography.Paragraph type="secondary">
          Kiểm tra BP sẽ được cộng trước khi finalize. Các dòng thiếu vị trí, đã hủy, không có reward
          hoặc đã cộng trước đó sẽ không cộng thêm BP.
        </Typography.Paragraph>
        <AppTable<TournamentRewardPreviewRow>
          rowKey="registrationId"
          loading={rewardPreviewQuery.isLoading}
          columns={previewColumns}
          dataSource={rewardPreviewQuery.data ?? []}
          pagination={false}
        />
      </Modal>
    </div>
  );
}
