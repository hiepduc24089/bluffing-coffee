import { useMemo, useState } from 'react';
import { DollarOutlined, EditOutlined, RollbackOutlined } from '@ant-design/icons';
import { Card, Popconfirm, Space, Statistic, Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import AppButton from '@/shared/components/atoms/AppButton';
import AppDatePicker from '@/shared/components/atoms/AppDatePicker';
import AppTable from '@/shared/components/atoms/AppTable';
import { PageHeader } from '@/shared/components/layout/page-header';
import { useAppToast } from '@/shared/hooks/use-app-toast';
import { useAdminPermissions } from '@/admin/modules/auth/hooks/use-admin-permissions';
import { HourlyRateModal } from '@/admin/modules/payroll/components/hourly-rate-modal';
import { PayrollShiftTable } from '@/admin/modules/payroll/components/payroll-shift-table';
import {
  usePayroll,
  usePayrollPaymentMutations,
  useUpdateHourlyRate,
} from '@/admin/modules/payroll/hooks/use-payroll';
import { formatCurrency, formatHours } from '@/admin/modules/payroll/utils/payroll.util';
import type { PayrollRow } from '@/admin/modules/payroll/types/payroll.type';

/** Dòng đã trả thì lấy số đã chuyển khoản, chưa trả thì lấy số tính từ lịch. */
function effectivePay(row: PayrollRow): number {
  return (row.isPaid ? row.payment?.totalPay : row.totalPay) ?? 0;
}

export function PayrollPage() {
  const toast = useAppToast();
  const { can } = useAdminPermissions();
  const [month, setMonth] = useState(() => dayjs().format('YYYY-MM'));
  const [editingRow, setEditingRow] = useState<PayrollRow | null>(null);

  const { data: rows = [], isLoading } = usePayroll(month);
  const updateRate = useUpdateHourlyRate();
  const { pay, revert } = usePayrollPaymentMutations(month);
  // Không có quyền xem toàn quán thì backend chỉ trả về đúng dòng của mình,
  // nên bỏ luôn các con số tổng và nút sửa lương.
  const canViewAll = can('special.view_all_payroll');
  const canEditRate = canViewAll && can('payroll.update');
  const canPay = canViewAll && can('special.pay_salary');

  const totals = useMemo(
    () =>
      rows.reduce(
        (accumulator, row) => ({
          hours: accumulator.hours + row.totalHours,
          pay: accumulator.pay + effectivePay(row),
          unpaid: accumulator.unpaid + (row.isPaid ? 0 : effectivePay(row)),
          missingRate: accumulator.missingRate + (row.hourlyRate === null && row.shiftCount > 0 ? 1 : 0),
        }),
        { hours: 0, pay: 0, unpaid: 0, missingRate: 0 },
      ),
    [rows],
  );

  const columns: ColumnsType<PayrollRow> = [
    {
      title: 'Nhân viên',
      key: 'staff',
      width: 190,
      render: (_, row) => (
        <Space direction="vertical" size={2}>
          <Typography.Text strong>{row.staff.name}</Typography.Text>
          <Tag color={row.staff.position === 'barista' ? 'cyan' : 'orange'}>
            {row.staff.positionLabel}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Số ca',
      key: 'shiftCount',
      // Đủ chỗ cho "2 Full-time · 1 Part-time" trên một dòng.
      width: 220,
      render: (_, row) => (
        <Space direction="vertical" size={2}>
          <Typography.Text>{row.shiftCount} ca</Typography.Text>
          <Typography.Text type="secondary">
            {row.fullShiftCount} Full-time · {row.halfShiftCount} Part-time
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Giờ công',
      dataIndex: 'totalHours',
      key: 'totalHours',
      width: 110,
      align: 'right',
      render: (hours: number) => formatHours(hours),
    },
    {
      title: 'Lương giờ',
      key: 'hourlyRate',
      width: 150,
      align: 'right',
      render: (_, row) =>
        row.hourlyRate === null ? (
          <Typography.Text type="warning">Chưa chốt</Typography.Text>
        ) : (
          formatCurrency(row.hourlyRate)
        ),
    },
    {
      title: 'Thành tiền',
      key: 'totalPay',
      width: 190,
      align: 'right',
      render: (_, row) => (
        <Typography.Text strong>
          {formatCurrency(row.isPaid ? (row.payment?.totalPay ?? null) : row.totalPay)}
        </Typography.Text>
      ),
    },
    {
      title: 'Thanh toán',
      key: 'paymentStatus',
      width: 190,
      render: (_, row) =>
        row.payment ? (
          <Space direction="vertical" size={2}>
            <Tag color="green">Đã chuyển khoản</Tag>
            <Typography.Text type="secondary">{row.payment.paidAt}</Typography.Text>
          </Space>
        ) : (
          <Tag>Chưa thanh toán</Tag>
        ),
    },
  ];

  if (canEditRate || canPay) {
    columns.push({
      title: 'Thao tác',
      key: 'actions',
      width: 130,
      align: 'center',
      render: (_, row) => (
        <Space size={8}>
          {canEditRate ? (
            <Tooltip title={row.isPaid ? 'Đã thanh toán, sửa lương giờ không đổi số đã trả' : 'Sửa lương giờ'}>
              <AppButton icon={<EditOutlined />} onClick={() => setEditingRow(row)} />
            </Tooltip>
          ) : null}
          {canPay ? renderPaymentAction(row) : null}
        </Space>
      ),
    });
  }

  function renderPaymentAction(row: PayrollRow) {
    if (row.isPaid) {
      return (
        <Popconfirm
          title="Hủy thanh toán"
          description={`Gỡ đánh dấu đã chuyển khoản cho ${row.staff.name} và mở khóa lại các ca của tháng này.`}
          okText="Hủy thanh toán"
          cancelText="Đóng"
          okButtonProps={{ danger: true }}
          onConfirm={() => void handleRevert(row)}
        >
          <Tooltip title="Hủy thanh toán">
            <AppButton icon={<RollbackOutlined />} loading={revert.isPending} />
          </Tooltip>
        </Popconfirm>
      );
    }

    // Chưa chốt lương giờ hoặc không có ca nào thì không có gì để chuyển khoản.
    if (!row.isPayable) {
      return (
        <Tooltip title={row.shiftCount === 0 ? 'Không có ca nào trong tháng' : 'Chưa chốt lương giờ'}>
          <AppButton icon={<DollarOutlined />} disabled />
        </Tooltip>
      );
    }

    return (
      <Popconfirm
        title="Thanh toán lương"
        description={`Xác nhận đã chuyển khoản ${formatCurrency(row.totalPay)} cho ${row.staff.name}. Các ca của tháng này sẽ bị khóa.`}
        okText="Đã chuyển khoản"
        cancelText="Hủy"
        onConfirm={() => void handlePay(row)}
      >
        <Tooltip title="Thanh toán lương">
          <AppButton type="primary" icon={<DollarOutlined />} loading={pay.isPending} />
        </Tooltip>
      </Popconfirm>
    );
  }

  const handlePay = async (row: PayrollRow) => {
    await pay.mutateAsync(row.staff.id);
    toast.success(`Đã ghi nhận thanh toán lương cho ${row.staff.name}.`);
  };

  const handleRevert = async (row: PayrollRow) => {
    await revert.mutateAsync(row.staff.id);
    toast.success(`Đã hủy thanh toán lương của ${row.staff.name}.`);
  };

  const renderSummary = () => (
    <Table.Summary.Row>
      {/* Ô đầu tiên chừa cho cột mũi tên mở rộng, nếu không cả hàng tổng lệch một cột. */}
      <Table.Summary.Cell index={0} />
      <Table.Summary.Cell index={1}>
        <Typography.Text strong>Total</Typography.Text>
      </Table.Summary.Cell>
      <Table.Summary.Cell index={2} />
      <Table.Summary.Cell index={3} align="right">
        <Typography.Text strong>{formatHours(totals.hours)}</Typography.Text>
      </Table.Summary.Cell>
      <Table.Summary.Cell index={4} />
      <Table.Summary.Cell index={5} align="right">
        <Typography.Text strong>{formatCurrency(totals.pay)}</Typography.Text>
      </Table.Summary.Cell>
      <Table.Summary.Cell index={6} />
      {canEditRate || canPay ? <Table.Summary.Cell index={7} /> : null}
    </Table.Summary.Row>
  );

  const handleSubmitRate = async (hourlyRate: number | null) => {
    if (!editingRow) return;

    await updateRate.mutateAsync({ staffId: editingRow.staff.id, hourlyRate });
    toast.success('Đã cập nhật lương giờ.');
    setEditingRow(null);
  };

  return (
    <div className="page-stack">
      <PageHeader
        title="Bảng lương"
        subtitle={
          canViewAll
            ? 'Giờ công lấy trực tiếp từ các ca đã xếp trên lịch làm việc của tháng.'
            : 'Giờ công và lương của bạn, tính từ các ca đã xếp trên lịch làm việc.'
        }
        extra={
          <AppDatePicker
            picker="month"
            allowClear={false}
            value={dayjs(month, 'YYYY-MM')}
            onChange={(value) => setMonth((value ?? dayjs()).format('YYYY-MM'))}
          />
        }
      />

      <div className={canViewAll ? 'payroll-summary' : 'payroll-summary payroll-summary--self'}>
        <Card size="small">
          <Statistic
            title={canViewAll ? 'Tổng giờ công' : 'Giờ công của bạn'}
            value={formatHours(totals.hours)}
          />
        </Card>
        <Card size="small">
          <Statistic
            title={canViewAll ? 'Tổng chi lương' : 'Lương tháng này'}
            value={formatCurrency(totals.pay)}
          />
        </Card>
        {canViewAll ? (
          <Card size="small">
            <Statistic
              title="Lương chưa thanh toán"
              value={formatCurrency(totals.unpaid)}
              valueStyle={totals.unpaid > 0 ? { color: '#d97706' } : undefined}
            />
          </Card>
        ) : null}
        {canViewAll ? (
          <Card size="small">
            <Statistic
              title="Chưa chốt lương giờ"
              value={`${totals.missingRate} người`}
              valueStyle={totals.missingRate > 0 ? { color: '#d97706' } : undefined}
            />
          </Card>
        ) : null}
      </div>

      <AppTable<PayrollRow>
        rowKey={(row) => row.staff.id}
        loading={isLoading}
        columns={columns}
        dataSource={rows}
        recordCount={rows.length}
        expandable={{
          expandedRowRender: (row) => <PayrollShiftTable shifts={row.shifts} />,
          rowExpandable: (row) => row.shiftCount > 0,
        }}
        summary={canViewAll ? renderSummary : undefined}
      />

      <HourlyRateModal
        open={Boolean(editingRow)}
        row={editingRow}
        submitting={updateRate.isPending}
        onCancel={() => setEditingRow(null)}
        onSubmit={(hourlyRate) => {
          void handleSubmitRate(hourlyRate);
        }}
      />
    </div>
  );
}
