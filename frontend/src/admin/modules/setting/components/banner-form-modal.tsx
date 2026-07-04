import { useEffect, useMemo, useRef, useState } from 'react';
import { Form, Space, Switch } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import AppButton from '@/shared/components/atoms/AppButton';
import AppInputNumber from '@/shared/components/atoms/AppInputNumber';
import AppModal from '@/shared/components/atoms/AppModal';
import AppTextField from '@/shared/components/atoms/AppTextField';
import { uploadSettingImage } from '@/admin/modules/setting/api/setting.api';
import type { BannerFormValues, BannerRow } from '@/admin/modules/setting/types/setting.type';
import {
  stableSerialize,
  useUnsavedChangesGuard,
} from '@/shared/hooks/use-unsaved-changes-guard';

type BannerFormModalProps = {
  open: boolean;
  initialValues?: BannerRow | null;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: BannerFormValues) => Promise<void>;
};

export function BannerFormModal({ open, initialValues, submitting, onCancel, onSubmit }: BannerFormModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [initialSnapshot, setInitialSnapshot] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formValues, setFormValues] = useState<BannerFormValues>({
    title: '',
    image: '',
    linkUrl: '',
    sortOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    if (!open) return;

    const nextValues = {
      title: initialValues?.title ?? '',
      image: initialValues?.image ?? '',
      linkUrl: initialValues?.linkUrl ?? '',
      sortOrder: initialValues?.sortOrder ?? 0,
      isActive: initialValues?.isActive ?? true,
    };

    setFormValues(nextValues);
    setImagePreviewUrl(initialValues?.imageUrl ?? toStorageUrl(nextValues.image));
    setInitialSnapshot(stableSerialize(normalizeBannerFormValues(nextValues)));
  }, [initialValues, open]);

  const currentSnapshot = useMemo(
    () => stableSerialize(normalizeBannerFormValues(formValues)),
    [formValues],
  );
  const hasUnsavedChanges = Boolean(open && initialSnapshot && initialSnapshot !== currentSnapshot);
  const confirmUnsavedChanges = useUnsavedChangesGuard({
    enabled: hasUnsavedChanges && !submitting,
  });

  return (
    <AppModal
      isOpen={open}
      onClose={() => confirmUnsavedChanges(onCancel)}
      title={initialValues ? 'Cập nhật banner' : 'Thêm banner'}
      maxWidth="max-w-3xl"
      okText={initialValues ? 'Cập nhật' : 'Tạo mới'}
      confirmLoading={submitting}
      onOk={() => onSubmit(formValues)}
      cancelText="Hủy"
    >
      <Form layout="vertical">
        <Form.Item label="Tiêu đề">
          <AppTextField
            value={formValues.title ?? ''}
            onChange={(event) => setFormValues((current) => ({ ...current, title: event.target.value }))}
            placeholder="Tên banner nội bộ"
          />
        </Form.Item>

        <Form.Item label="Ảnh banner" required>
          <Space direction="vertical" size={10} className="w-full">
            {imagePreviewUrl ? <img className="setting-banner-preview" src={imagePreviewUrl} alt="" /> : null}
            <Space wrap>
              <AppTextField
                value={formValues.image}
                onChange={(event) => {
                  const nextPath = event.target.value;
                  setFormValues((current) => ({ ...current, image: nextPath }));
                  setImagePreviewUrl(toStorageUrl(nextPath));
                }}
                placeholder="Path ảnh sau khi upload"
                style={{ minWidth: 360 }}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setUploadingImage(true);
                  try {
                    const uploaded = await uploadSettingImage(file, 'settings/banners');
                    setFormValues((current) => ({ ...current, image: uploaded.path }));
                    setImagePreviewUrl(uploaded.url);
                    event.target.value = '';
                  } finally {
                    setUploadingImage(false);
                  }
                }}
              />
              <AppButton
                icon={<UploadOutlined />}
                loading={uploadingImage}
                onClick={() => fileInputRef.current?.click()}
              >
                Chọn ảnh
              </AppButton>
            </Space>
          </Space>
        </Form.Item>

        <Form.Item label="Link khi click">
          <AppTextField
            value={formValues.linkUrl ?? ''}
            onChange={(event) => setFormValues((current) => ({ ...current, linkUrl: event.target.value }))}
            placeholder="https://..."
          />
        </Form.Item>

        <Form.Item label="Thứ tự">
          <AppInputNumber
            min={0}
            value={formValues.sortOrder}
            onChange={(value) => setFormValues((current) => ({ ...current, sortOrder: Number(value ?? 0) }))}
          />
        </Form.Item>

        <Form.Item label="Hiển thị">
          <Switch
            checked={formValues.isActive}
            onChange={(checked) => setFormValues((current) => ({ ...current, isActive: checked }))}
          />
        </Form.Item>
      </Form>
    </AppModal>
  );
}

function toStorageUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('/') || path.startsWith('data:')) return path;

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  return `${apiUrl.replace(/\/api\/?$/, '')}/storage/${path}`;
}

function normalizeBannerFormValues(values: BannerFormValues) {
  return {
    title: values.title || null,
    image: values.image || '',
    linkUrl: values.linkUrl || null,
    sortOrder: Number(values.sortOrder ?? 0),
    isActive: Boolean(values.isActive),
  };
}
