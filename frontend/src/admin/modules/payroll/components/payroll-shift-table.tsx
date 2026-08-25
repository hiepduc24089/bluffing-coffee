import { Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { formatHours } from '@/admin/modules/payroll/utils/payroll.util';
import type { PayrollShift } from '@/admin/modules/payroll/types/payroll.type';

type PayrollShiftTableProps = {
  shifts: PayrollShift[];
};

/** Bảng chi tiết trong dòng mở rộng: nhân viên thắc mắc thì mở ra đối chiếu từng ca. */
export function PayrollShiftTable({ shifts }: PayrollShiftTableProps) {
  if (shifts.length === 0) {
    return <Typography.Text type="secondary">Tháng này chưa xếp ca nào.</Typography.Text>;
  }

  return (
    <Table<PayrollShift>
      size="small"
      rowKey={(shift) => `${shift.workDate}-${shift.slot}`}
      dataSource={shifts}
      pagination={false}
      columns={[
        {
          title: 'Ngày',
          dataIndex: 'workDate',
          key: 'workDate',
          render: (value: string) => dayjs(value).format('dd DD/MM/YYYY'),
        },
        {
          title: 'Khung ca',
          key: 'slot',
          render: (_, shift) => (
            <Tag color={shift.slot === 'full' ? 'blue' : 'default'}>{shift.slotLabel}</Tag>
          ),
        },
        {
          title: 'Giờ',
          key: 'time',
          render: (_, shift) => `${shift.startAt} – ${shift.endAt}`,
        },
        {
          title: 'Công',
          dataIndex: 'hours',
          key: 'hours',
          align: 'right',
          render: (hours: number) => formatHours(hours),
        },
      ]}
    />
  );
}
