import { useEffect, useMemo, useRef, useState } from 'react';
import { Form, Space } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import AppButton from '@/shared/components/atoms/AppButton';
import AppModal from '@/shared/components/atoms/AppModal';
import AppTextField from '@/shared/components/atoms/AppTextField';
import { uploadSettingImage } from '@/admin/modules/setting/api/setting.api';
import { RichContentEditor } from '@/admin/modules/setting/components/rich-content-editor';
import type {
  ContentPageFormValues,
  ContentPageRow,
  ContentPageType,
} from '@/admin/modules/setting/types/setting.type';
import {
  stableSerialize,
  useUnsavedChangesGuard,
} from '@/shared/hooks/use-unsaved-changes-guard';

type ContentPageFormModalProps = {
  open: boolean;
  type: ContentPageType;
  title: string;
  initialValues?: ContentPageRow | null;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: ContentPageFormValues) => Promise<void>;
};

export function ContentPageFormModal({
  open,
  type,
  title,
  initialValues,
  submitting,
  onCancel,
  onSubmit,
}: ContentPageFormModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [initialSnapshot, setInitialSnapshot] = useState('');
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [formValues, setFormValues] = useState<ContentPageFormValues>({
    type,
    title: '',
    coverImage: null,
    content: '',
  });

  useEffect(() => {
    if (!open) return;

    const nextValues = {
      type,
      title: initialValues?.title ?? '',
      coverImage: initialValues?.coverImage ?? null,
      content: initialValues?.content ?? '',
    };

    setFormValues(nextValues);
    setCoverPreviewUrl(initialValues?.coverImageUrl ?? toStorageUrl(nextValues.coverImage));
    setInitialSnapshot(stableSerialize(normalizeContentPageFormValues(nextValues)));
  }, [initialValues, open, type]);

  const currentSnapshot = useMemo(
    () => stableSerialize(normalizeContentPageFormValues(formValues)),
    [formValues],
  );
  const hasUnsavedChanges = Boolean(open && initialSnapshot && initialSnapshot !== currentSnapshot);
  const confirmUnsavedChanges = useUnsavedChangesGuard({
    enabled: hasUnsavedChanges && !submitting,
  });

  const submit = async () => {
    await onSubmit(formValues);
  };
  const imageDirectory = type === 'post' ? 'settings/posts' : 'settings/events';

  return (
    <AppModal
      isOpen={open}
      onClose={() => confirmUnsavedChanges(onCancel)}
      title={initialValues ? `Cập nhật ${title.toLowerCase()}` : `Tạo ${title.toLowerCase()}`}
      maxWidth="max-w-5xl"
      okText={initialValues ? 'Cập nhật' : 'Tạo mới'}
      confirmLoading={submitting}
      onOk={submit}
      cancelText="Hủy"
    >
      <Form layout="vertical">
        <Form.Item label="Tiêu đề" required>
          <AppTextField
            value={formValues.title}
            onChange={(event) => setFormValues((current) => ({ ...current, title: event.target.value }))}
            placeholder={`Nhập tiêu đề ${title.toLowerCase()}`}
          />
        </Form.Item>

        <Form.Item label="Ảnh đại diện">
          <Space direction="vertical" size={10} className="w-full">
            {coverPreviewUrl ? (
              <img className="setting-cover-preview" src={coverPreviewUrl} alt="" />
            ) : null}
            <Space wrap>
              <AppTextField
                value={formValues.coverImage ?? ''}
                onChange={(event) => {
                  const nextPath = event.target.value;
                  setFormValues((current) => ({ ...current, coverImage: nextPath }));
                  setCoverPreviewUrl(toStorageUrl(nextPath));
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
                  setUploadingCover(true);
                  try {
                    const uploaded = await uploadSettingImage(file, imageDirectory);
                    setFormValues((current) => ({ ...current, coverImage: uploaded.path }));
                    setCoverPreviewUrl(uploaded.url);
                    event.target.value = '';
                  } finally {
                    setUploadingCover(false);
                  }
                }}
              />
              <AppButton
                icon={<UploadOutlined />}
                loading={uploadingCover}
                onClick={() => fileInputRef.current?.click()}
              >
                Chọn ảnh
              </AppButton>
            </Space>
          </Space>
        </Form.Item>

        <Form.Item label="Nội dung">
          <Space direction="vertical" size={8} className="w-full">
            <RichContentEditor
              value={formValues.content}
              onChange={(content) => setFormValues((current) => ({ ...current, content }))}
              uploadImage={async (file) => {
                const uploaded = await uploadSettingImage(file, 'settings/content');
                return uploaded.url;
              }}
            />
          </Space>
        </Form.Item>

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

function normalizeContentPageFormValues(values: ContentPageFormValues) {
  return {
    type: values.type,
    title: values.title ?? '',
    coverImage: values.coverImage || null,
    content: values.content || '',
  };
}
