import { useEffect, useState } from 'react';
import { Divider, Space, Spin, Table, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import AppButton from '@/shared/components/atoms/AppButton';
import AppCheckbox from '@/shared/components/atoms/AppCheckbox';
import AppModal from '@/shared/components/atoms/AppModal';
import { getPermissionCatalog, staffQueryKeys } from '@/admin/modules/staff/api/staff.api';
import type {
  PermissionCatalogModule,
  StaffRow,
} from '@/admin/modules/staff/types/staff.type';

type StaffPermissionModalProps = {
  open: boolean;
  staff: StaffRow | null;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (permissions: string[]) => Promise<void> | void;
};

export function StaffPermissionModal({
  open,
  staff,
  submitting,
  onCancel,
  onSubmit,
}: StaffPermissionModalProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const { data: catalog, isLoading } = useQuery({
    queryKey: staffQueryKeys.catalog,
    queryFn: getPermissionCatalog,
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;

    setSelected(staff?.permissions ?? []);
  }, [open, staff]);

  const toggle = (permission: string, checked: boolean) =>
    setSelected((current) =>
      checked
        ? [...new Set([...current, permission])]
        : current.filter((item) => item !== permission),
    );

  const columns = [
    {
      title: 'Module',
      dataIndex: 'label',
      key: 'label',
      width: 200,
      render: (label: string) => <Typography.Text strong>{label}</Typography.Text>,
    },
    {
      title: 'Quyền',
      key: 'actions',
      render: (_: unknown, record: PermissionCatalogModule) => (
        <Space size={16} wrap>
          {record.actions.map((action) => (
            <AppCheckbox
              key={action.permission}
              checked={selected.includes(action.permission)}
              onChange={(event) => toggle(action.permission, event.target.checked)}
            >
              {action.label}
            </AppCheckbox>
          ))}
        </Space>
      ),
    },
  ];

  return (
    <AppModal
      isOpen={open}
      title={staff ? `Phân quyền — ${staff.name}` : 'Phân quyền'}
      onClose={onCancel}
      footer={null}
      maxWidth="max-w-3xl"
    >
      {isLoading || !catalog ? (
        <div className="auth-loading">
          <Spin />
        </div>
      ) : (
        <>
          <Table<PermissionCatalogModule>
            rowKey="key"
            size="small"
            pagination={false}
            columns={columns}
            dataSource={catalog.modules}
          />

          <Divider orientation="left">Quyền đặc biệt</Divider>

          <Space direction="vertical" size={8}>
            {catalog.specialPermissions.map((special) => (
              <AppCheckbox
                key={special.permission}
                checked={selected.includes(special.permission)}
                onChange={(event) => toggle(special.permission, event.target.checked)}
              >
                {special.label}
              </AppCheckbox>
            ))}
          </Space>

          <div className="modal-actions">
            <AppButton onClick={onCancel}>Hủy</AppButton>
            <AppButton type="primary" loading={submitting} onClick={() => onSubmit(selected)}>
              Lưu quyền
            </AppButton>
          </div>
        </>
      )}
    </AppModal>
  );
}
