import { useState } from 'react';
import { Segmented, Space, Tag, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import type { ColumnsType } from 'antd/es/table';
import AppTable from '@/shared/components/atoms/AppTable';
import { PageHeader } from '@/shared/components/layout/page-header';
import {
  getLeaderboard,
  leaderboardQueryKeys,
  type LeaderboardType,
} from '@/admin/modules/leaderboard/api/leaderboard.api';
import type { UserRow } from '@/admin/modules/user/types/user.type';

const leaderboardLabels: Record<LeaderboardType, string> = {
  bp_balance: 'BP hiện tại',
  total_bp_earned: 'Tổng BP kiếm được',
  championships_won: 'Vô địch',
  tournaments_played: 'Số giải đã chơi',
};

function getMetricValue(user: UserRow, type: LeaderboardType): number {
  if (type === 'bp_balance') {
    return user.bpBalance;
  }

  if (type === 'total_bp_earned') {
    return user.statistic?.totalBpEarned ?? 0;
  }

  if (type === 'championships_won') {
    return user.statistic?.championshipsWon ?? 0;
  }

  return user.statistic?.tournamentsPlayed ?? 0;
}

export function LeaderboardPage() {
  const [type, setType] = useState<LeaderboardType>('bp_balance');
  const { data = [], isLoading } = useQuery({
    queryKey: leaderboardQueryKeys.list(type),
    queryFn: () => getLeaderboard(type),
  });

  const columns: ColumnsType<UserRow> = [
    {
      title: '#',
      key: 'rank',
      width: 64,
      align: 'center',
      render: (_, __, index) => <Typography.Text strong>{index + 1}</Typography.Text>,
    },
    {
      title: 'Thành viên',
      key: 'member',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{record.name}</Typography.Text>
          <Typography.Text type="secondary">{record.phone}</Typography.Text>
        </Space>
      ),
    },
    {
      title: leaderboardLabels[type],
      key: 'metric',
      align: 'right',
      render: (_, record) => getMetricValue(record, type).toLocaleString('vi-VN'),
    },
    {
      title: 'Rank',
      dataIndex: 'rankLevel',
      key: 'rankLevel',
      render: (value?: string | null) => value ?? '-',
    },
    {
      title: 'Huy hiệu',
      key: 'badges',
      render: (_, record) => (
        <Space size={[4, 4]} wrap>
          {(record.badges ?? []).slice(0, 4).map((badge) => (
            <Tag key={badge.id} color={badge.isSystem ? 'blue' : 'default'}>
              {badge.name}
            </Tag>
          ))}
          {(record.badges?.length ?? 0) > 4 ? <Tag>+{(record.badges?.length ?? 0) - 4}</Tag> : null}
        </Space>
      ),
    },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        title="Leaderboard"
        subtitle="Bảng xếp hạng thành viên theo BP và thành tích tournament."
      />

      <Segmented
        value={type}
        options={[
          { label: 'BP hiện tại', value: 'bp_balance' },
          { label: 'Tổng BP', value: 'total_bp_earned' },
          { label: 'Vô địch', value: 'championships_won' },
          { label: 'Giải đã chơi', value: 'tournaments_played' },
        ]}
        onChange={(value) => setType(value as LeaderboardType)}
      />

      <AppTable<UserRow>
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={isLoading}
      />
    </div>
  );
}
