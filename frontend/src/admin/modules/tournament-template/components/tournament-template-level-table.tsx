import { Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import AppTable from '@/shared/components/atoms/AppTable';
import type { TournamentTemplateLevel } from '@/admin/modules/tournament-template/types/tournament-template.type';
import { formatChips } from '@/admin/modules/tournament-template/utils/tournament-template.util';

type TournamentTemplateLevelTableProps = {
  levels: TournamentTemplateLevel[];
};

const columns: ColumnsType<TournamentTemplateLevel> = [
  {
    title: 'Level',
    dataIndex: 'levelNumber',
    key: 'levelNumber',
    width: 90,
    render: (value: number | null, record) =>
      record.isBreak ? <Tag color="orange">Break</Tag> : <Tag>{value}</Tag>,
  },
  {
    title: 'Small blind',
    dataIndex: 'smallBlind',
    key: 'smallBlind',
    render: (value: number, record) => (record.isBreak ? '-' : formatChips(value)),
  },
  {
    title: 'Big blind',
    dataIndex: 'bigBlind',
    key: 'bigBlind',
    render: (value: number, record) => (record.isBreak ? '-' : formatChips(value)),
  },
  {
    title: 'Ante',
    dataIndex: 'ante',
    key: 'ante',
    render: (value: number, record) => (record.isBreak || !value ? '-' : formatChips(value)),
  },
  {
    title: 'Thời lượng',
    dataIndex: 'durationMinutes',
    key: 'durationMinutes',
    width: 110,
    render: (value: number) => `${value} phút`,
  },
  {
    title: 'Ghi chú',
    dataIndex: 'note',
    key: 'note',
    render: (value?: string | null) => value || '-',
  },
];

export function TournamentTemplateLevelTable({ levels }: TournamentTemplateLevelTableProps) {
  return (
    <AppTable<TournamentTemplateLevel>
      rowKey="id"
      size="small"
      columns={columns}
      dataSource={levels}
      pagination={false}
    />
  );
}
