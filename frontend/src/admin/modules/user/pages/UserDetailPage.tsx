import { useMemo, useState } from 'react';
import { ArrowLeftOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Card, Descriptions, Empty, Popconfirm, Space, Statistic, Tag, Tooltip, Typography } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import AppButton from '@/shared/components/atoms/AppButton';
import AppSelect from '@/shared/components/atoms/AppSelect';
import AppTable from '@/shared/components/atoms/AppTable';
import { PageHeader } from '@/shared/components/layout/page-header';
import { badgeQueryKeys, getBadgeList } from '@/admin/modules/badge/api/badge.api';
import type { BpTransactionRow, TournamentRegistrationRow } from '@/admin/modules/tournament/types/tournament.type';
import {
  attachUserBadge,
  detachUserBadge,
  getUserDetail,
  userQueryKeys,
} from '@/admin/modules/user/api/user.api';
import { useAppToast } from '@/shared/hooks/use-app-toast';

const formatNumber = (value?: number | null) => (value ?? 0).toLocaleString('vi-VN');

export function UserDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const toast = useAppToast();
  const [selectedBadgeId, setSelectedBadgeId] = useState<string>();

  const userId = id ?? '';
  const userQuery = useQuery({
    queryKey: userQueryKeys.detail(userId),
    queryFn: () => getUserDetail(userId),
    enabled: Boolean(userId),
  });

  const badgesQuery = useQuery({
    queryKey: badgeQueryKeys.list({ keyword: '', page: 1, perPage: 100 }),
    queryFn: () => getBadgeList({ keyword: '', page: 1, perPage: 100 }),
  });

  const user = userQuery.data;
  const ownedBadgeIds = useMemo(
    () => new Set((user?.badges ?? []).map((badge) => badge.id)),
    [user?.badges],
  );

  const availableBadgeOptions = useMemo(
    () =>
      (badgesQuery.data?.data ?? [])
        .filter((badge) => !ownedBadgeIds.has(badge.id))
        .map((badge) => ({
          label: `${badge.name} (${badge.code})`,
          value: badge.id,
        })),
    [badgesQuery.data?.data, ownedBadgeIds],
  );

  const invalidateUser = async () => {
    await queryClient.invalidateQueries({ queryKey: userQueryKeys.detail(userId) });
    await queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
  };

  const attachBadgeMutation = useMutation({
    mutationFn: () => attachUserBadge(userId, selectedBadgeId as string),
    onSuccess: async () => {
      toast.success('Đã gán huy hiệu.');
      setSelectedBadgeId(undefined);
      await invalidateUser();
    },
  });

  const detachBadgeMutation = useMutation({
    mutationFn: (badgeId: string) => detachUserBadge(userId, badgeId),
    onSuccess: async () => {
      toast.success('Đã gỡ huy hiệu.');
      await invalidateUser();
    },
  });

  const bpColumns: ColumnsType<BpTransactionRow> = [
    {
      title: 'Ngày',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value?: string) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '-'),
    },
    {
      title: 'Loại',
      dataIndex: 'transactionType',
      key: 'transactionType',
      render: (value: string) => <Tag>{value}</Tag>,
    },
    {
      title: 'BP',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (value: number) => formatNumber(value),
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      render: (value?: string | null) => value || '-',
    },
  ];

  const registrationColumns: ColumnsType<TournamentRegistrationRow> = [
    {
      title: 'Giải đấu',
      key: 'tournament',
      render: (_, record) => record.tournament?.name ?? `#${record.tournamentId}`,
    },
    {
      title: 'Ngày đăng ký',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value?: string) => (value ? dayjs(value).format('DD/MM/YYYY') : '-'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (value: string) => <Tag>{value}</Tag>,
    },
    {
      title: 'Vị trí',
      dataIndex: 'finalPosition',
      key: 'finalPosition',
      align: 'right',
      render: (value?: number | null) => value ?? '-',
    },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        title={user?.name ?? 'Chi tiết thành viên'}
        subtitle={user ? `${user.phone} - ${user.rankLevel ?? 'Chưa có rank'}` : 'Đang tải dữ liệu'}
        extra={
          <AppButton icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/users')}>
            Quay lại
          </AppButton>
        }
      />

      <Card loading={userQuery.isLoading}>
        <Descriptions column={3} bordered size="small">
          <Descriptions.Item label="Tên">{user?.name ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">{user?.phone ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">
            {user?.createdAt ? dayjs(user.createdAt).format('DD/MM/YYYY') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="BP hiện tại">{formatNumber(user?.bpBalance)}</Descriptions.Item>
          <Descriptions.Item label="Rank">{user?.rankLevel ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Lần chơi gần nhất">
            {user?.statistic?.lastPlayedAt
              ? dayjs(user.statistic.lastPlayedAt).format('DD/MM/YYYY HH:mm')
              : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Space size={16} wrap>
        <Card>
          <Statistic title="Tổng BP kiếm được" value={user?.statistic?.totalBpEarned ?? 0} />
        </Card>
        <Card>
          <Statistic title="Giải đã chơi" value={user?.statistic?.tournamentsPlayed ?? 0} />
        </Card>
        <Card>
          <Statistic title="Vô địch" value={user?.statistic?.championshipsWon ?? 0} />
        </Card>
        <Card>
          <Statistic title="Turbo wins" value={user?.statistic?.turboWins ?? 0} />
        </Card>
        <Card>
          <Statistic title="DeepStack wins" value={user?.statistic?.deepstackWins ?? 0} />
        </Card>
      </Space>

      <Card title="Huy hiệu">
        <Space wrap size={12} className="toolbar">
          <AppSelect
            className="min-w-[280px]"
            placeholder="Chọn huy hiệu"
            value={selectedBadgeId}
            options={availableBadgeOptions}
            loading={badgesQuery.isLoading}
            onChange={(value) => setSelectedBadgeId(value as string)}
          />
          <AppButton
            type="primary"
            icon={<PlusOutlined />}
            disabled={!selectedBadgeId}
            loading={attachBadgeMutation.isPending}
            onClick={() => attachBadgeMutation.mutate()}
          >
            Gán huy hiệu
          </AppButton>
        </Space>

        {(user?.badges ?? []).length > 0 ? (
          <Space wrap size={[8, 8]}>
            {user?.badges.map((badge) => (
              <Tag key={badge.id} color={badge.isSystem ? 'blue' : 'default'}>
                <Space size={6}>
                  <span>{badge.name}</span>
                  <Typography.Text type="secondary">{badge.code}</Typography.Text>
                  <Popconfirm
                    title="Gỡ huy hiệu"
                    description="Huy hiệu này sẽ bị gỡ khỏi thành viên."
                    okText="Gỡ"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => detachBadgeMutation.mutate(badge.id)}
                  >
                    <Tooltip title="Gỡ huy hiệu">
                      <AppButton
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        loading={detachBadgeMutation.isPending}
                      />
                    </Tooltip>
                  </Popconfirm>
                </Space>
              </Tag>
            ))}
          </Space>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có huy hiệu" />
        )}
      </Card>

      <Card title="Lịch sử BP gần đây">
        <AppTable<BpTransactionRow>
          rowKey="id"
          columns={bpColumns}
          dataSource={user?.bpTransactions ?? []}
          loading={userQuery.isLoading}
        />
      </Card>

      <Card title="Lịch sử tham gia giải">
        <AppTable<TournamentRegistrationRow>
          rowKey="id"
          columns={registrationColumns}
          dataSource={user?.tournamentRegistrations ?? []}
          loading={userQuery.isLoading}
        />
      </Card>
    </div>
  );
}
