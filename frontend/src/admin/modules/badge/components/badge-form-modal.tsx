import { useMemo, useRef, useState } from 'react';
import { Form, Space } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import AppButton from '@/shared/components/atoms/AppButton';
import AppModal from '@/shared/components/atoms/AppModal';
import AppSelect from '@/shared/components/atoms/AppSelect';
import AppTextArea from '@/shared/components/atoms/AppTextArea';
import AppTextField from '@/shared/components/atoms/AppTextField';
import { uploadBadgeIcon } from '@/admin/modules/badge/api/badge.api';
import type { BadgeFormValues, BadgeRow } from '@/admin/modules/badge/types/badge.type';
import {
  stableSerialize,
  useUnsavedChangesGuard,
} from '@/shared/hooks/use-unsaved-changes-guard';

const systemBadgeOptions = [
  {
    value: 'FIRST_WIN',
    label: 'FIRST_WIN - Thắng giải đầu tiên',
    name: 'First Win',
    description: 'Won the first tournament.',
  },
  {
    value: 'CHAMPION',
    label: 'CHAMPION - Vô địch một giải',
    name: 'Champion',
    description: 'Won a tournament.',
  },
  {
    value: 'TEN_TOURNAMENTS',
    label: 'TEN_TOURNAMENTS - Chơi 10 giải',
    name: '10 Tournaments',
    description: 'Played 10 tournaments.',
  },
  {
    value: 'DEEPSTACK_WINNER',
    label: 'DEEPSTACK_WINNER - Thắng DeepStack',
    name: 'DeepStack Winner',
    description: 'Won a DeepStack event.',
  },
  {
    value: 'TURBO_KING',
    label: 'TURBO_KING - Thắng Turbo',
    name: 'Turbo King',
    description: 'Won a Turbo event.',
  },
  {
    value: 'SITNGO_REGULAR',
    label: 'SITNGO_REGULAR - Người chơi Sit & Go',
    name: 'Sit & Go Regular',
    description: 'A regular Sit & Go player.',
  },
];

type BadgeFormModalProps = {
  open: boolean;
  initialValues?: BadgeRow | null;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: BadgeFormValues) => Promise<void> | void;
};

export function BadgeFormModal({
  open,
  initialValues,
  submitting,
  onCancel,
  onSubmit,
}: BadgeFormModalProps) {
  const [form] = Form.useForm<BadgeFormValues>();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const watchedValues = Form.useWatch([], form);
  const [initialSnapshot, setInitialSnapshot] = useState('');
  const [iconPreviewUrl, setIconPreviewUrl] = useState<string | null>(null);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const currentSnapshot = useMemo(
    () => stableSerialize(normalizeBadgeFormValues(form.getFieldsValue(true))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form, watchedValues],
  );
  const hasUnsavedChanges = Boolean(open && initialSnapshot && initialSnapshot !== currentSnapshot);
  const confirmUnsavedChanges = useUnsavedChangesGuard({
    enabled: hasUnsavedChanges && !submitting,
  });

  return (
    <AppModal
      isOpen={open}
      title={initialValues ? 'Chỉnh sửa huy hiệu' : 'Thêm huy hiệu'}
      onClose={() => confirmUnsavedChanges(onCancel)}
      footer={null}
      afterOpenChange={(isOpen) => {
        if (isOpen) {
          const nextValues = {
            name: initialValues?.name ?? '',
            code: initialValues?.code ?? '',
            icon: initialValues?.icon ?? '',
            description: initialValues?.description ?? '',
          };

          form.setFieldsValue(nextValues);
          setIconPreviewUrl(initialValues?.iconUrl ?? toStorageUrl(nextValues.icon));
          setInitialSnapshot(stableSerialize(normalizeBadgeFormValues(nextValues)));
        } else {
          form.resetFields();
          setInitialSnapshot('');
          setIconPreviewUrl(null);
        }
      }}
    >
      <Form<BadgeFormValues>
        form={form}
        layout="vertical"
        requiredMark
        onFinish={(values) =>
          onSubmit({
            ...values,
            icon: values.icon || null,
            description: values.description || null,
          })
        }
      >
        <Form.Item
          name="name"
          label="Tên huy hiệu"
          rules={[{ required: true, message: 'Vui lòng nhập tên huy hiệu' }]}
        >
          <AppTextField placeholder="First Win" />
        </Form.Item>

        <Form.Item
          name="code"
          label="Mã huy hiệu"
          extra="Mã huy hiệu là mã hệ thống dùng để tự động cấp badge theo thành tích."
          rules={[{ required: true, message: 'Vui lòng chọn mã huy hiệu' }]}
        >
          <AppSelect
            showSearch
            placeholder="Chọn mã huy hiệu"
            disabled={Boolean(initialValues?.isSystem)}
            options={systemBadgeOptions}
            onChange={(value) => {
              const option = systemBadgeOptions.find((item) => item.value === value);

              if (!option) return;

              form.setFieldsValue({
                name: option.name,
                description: option.description,
              });
            }}
          />
        </Form.Item>

        <Form.Item name="icon" label="Icon">
          <Space direction="vertical" size={10} className="w-full">
            {iconPreviewUrl ? <img className="badge-icon-preview" src={iconPreviewUrl} alt="" /> : null}
            <Space wrap>
              <AppTextField
                placeholder="Path ảnh sau khi upload"
                style={{ minWidth: 360 }}
                onChange={(event) => {
                  form.setFieldValue('icon', event.target.value);
                  setIconPreviewUrl(toStorageUrl(event.target.value));
                }}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setUploadingIcon(true);
                  try {
                    const uploaded = await uploadBadgeIcon(file);
                    form.setFieldValue('icon', uploaded.path);
                    setIconPreviewUrl(uploaded.url);
                    event.target.value = '';
                  } finally {
                    setUploadingIcon(false);
                  }
                }}
              />
              <AppButton
                icon={<UploadOutlined />}
                loading={uploadingIcon}
                onClick={() => fileInputRef.current?.click()}
              >
                Chọn ảnh
              </AppButton>
            </Space>
          </Space>
        </Form.Item>

        <Form.Item name="description" label="Mô tả">
          <AppTextArea rows={4} placeholder="Mô tả điều kiện hoặc ý nghĩa của huy hiệu" />
        </Form.Item>

        <div className="modal-actions">
          <AppButton onClick={() => confirmUnsavedChanges(onCancel)}>Hủy</AppButton>
          <AppButton type="primary" htmlType="submit" loading={submitting}>
            Lưu
          </AppButton>
        </div>
      </Form>
    </AppModal>
  );
}

function toStorageUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith('https://') || path.startsWith('/storage/')) return path;

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  return `${apiUrl.replace(/\/api\/?$/, '')}/storage/${path}`;
}

function normalizeBadgeFormValues(values: Partial<BadgeFormValues>) {
  return {
    name: values.name ?? '',
    code: values.code ?? '',
    icon: values.icon || null,
    description: values.description || null,
  };
}
