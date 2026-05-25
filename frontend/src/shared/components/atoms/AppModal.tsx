import { Button, Modal } from 'antd';
import type { ModalProps } from 'antd';
import React, { useCallback, useEffect, useRef } from 'react';
import { CloseOutlined } from '@ant-design/icons';

type AppModalStyles = NonNullable<ModalProps['styles']>;

export interface AppModalProps extends Omit<ModalProps, 'open' | 'onCancel'> {
  isOpen: boolean;
  onClose: () => void;
  /** Tailwind max-width class (e.g. max-w-2xl) or number in px; maps to Modal width */
  maxWidth?: string | number;
  /** Hide the cancel button */
  hideCancelButton?: boolean;
  /** Callback for delete button */
  onDelete?: () => void;
  /** Footer container className (e.g. flex justify-between items-center) */
  footerClassName?: string;
  /** Close when the user clicks outside the modal content. */
  closeOnOutsideClick?: boolean;
}

const MAX_WIDTH_MAP: Record<string, number> = {
  'max-w-sm': 384,
  'max-w-md': 448,
  'max-w-lg': 512,
  'max-w-xl': 576,
  'max-w-2xl': 672,
  'max-w-3xl': 768,
  'max-w-4xl': 896,
  'max-w-5xl': 1024,
  'max-w-6xl': 1152,
};

const AppModal: React.FC<AppModalProps> = ({
  isOpen,
  onClose,
  maxWidth = 'max-w-2xl',
  hideCancelButton,
  onDelete,
  footerClassName,
  closeOnOutsideClick = false,
  styles,
  panelRef,
  afterOpenChange,
  ...rest
}) => {
  // Ant Design's Modal keeps a stale onCancel closure during its close animation.
  // Use a ref so the handler always checks the *current* open state, preventing
  // ghost ESC events from firing onClose after the modal has already closed.
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;
  const modalPanelRef = useRef<HTMLDivElement | null>(null);

  const width = typeof maxWidth === 'number' ? maxWidth : (MAX_WIDTH_MAP[maxWidth] ?? 672);
  const defaultFooterClass = onDelete ? 'flex justify-between items-center' : 'flex justify-end';
  const footerClass = footerClassName ?? defaultFooterClass;

  const presetStyles: AppModalStyles = {
    wrapper: {
      padding: 16,
      maxHeight: '78vh',
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      paddingLeft: 16,
      paddingRight: 16,
      paddingTop: 12,
      paddingBottom: 12,
      flexShrink: 0,
    },
    body: {
      padding: 16,
      overflowY: 'auto',
    },
    footer: {
      padding: 16,
      flexShrink: 0,
      position: 'relative',
    },
  };

  const stylesObject = styles && typeof styles === 'object' ? styles : undefined;

  const mergedStyles: AppModalStyles = {
    header: { ...presetStyles.header, ...stylesObject?.header },
    body: { ...presetStyles.body, ...stylesObject?.body },
    footer: { ...presetStyles.footer, ...stylesObject?.footer },
  };

  const setModalPanelRef = useCallback(
    (node: HTMLDivElement | null) => {
      modalPanelRef.current = node;

      if (typeof panelRef === 'function') {
        panelRef(node);
        return;
      }

      if (panelRef) {
        (panelRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    },
    [panelRef]
  );

  const focusModalPanel = useCallback(() => {
    if (typeof document === 'undefined' || typeof HTMLElement === 'undefined') return;

    const panel = modalPanelRef.current;
    const activeElement = document.activeElement;

    if (!panel || !(activeElement instanceof HTMLElement)) return;

    // Keep explicit field focus, but do not let Ant Design's focus trap default to
    // the close/footer buttons where Enter would immediately dismiss or apply.
    const activeElementIsModalField =
      activeElement.matches('input, textarea, select, [contenteditable="true"], [autofocus]') ||
      activeElement.closest('.ant-input-number, .ant-picker, .ant-select') != null;
    const shouldKeepCurrentFocus =
      panel.contains(activeElement) &&
      activeElement !== panel &&
      activeElement.closest('.ant-modal-close') == null &&
      activeElementIsModalField;

    if (!shouldKeepCurrentFocus) {
      panel.focus({ preventScroll: true });
    }
  }, []);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    const frameId = window.requestAnimationFrame(focusModalPanel);
    return () => window.cancelAnimationFrame(frameId);
  }, [focusModalPanel, isOpen]);

  useEffect(() => {
    if (!isOpen || !closeOnOutsideClick) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!isOpenRef.current || !(event.target instanceof Element)) return;

      if (
        event.target.closest(
          [
            '.ant-modal',
            '.ant-modal-content',
            '.ant-picker-dropdown',
            '.ant-select-dropdown',
            '.ant-dropdown',
            '.ant-popover',
            '.ant-tooltip',
          ].join(',')
        )
      ) {
        return;
      }

      onClose();
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [closeOnOutsideClick, isOpen, onClose]);

  const handleAfterOpenChange = useCallback(
    (open: boolean) => {
      if (open && typeof window !== 'undefined') {
        window.requestAnimationFrame(focusModalPanel);
      }

      afterOpenChange?.(open);
    },
    [afterOpenChange, focusModalPanel]
  );

  return (
    <Modal
      closeIcon={<CloseOutlined style={{ color: '#fff' }} />}
      open={isOpen}
      onCancel={() => {
        if (!isOpenRef.current) return;
        onClose();
      }}
      width={width}
      centered={true}
      panelRef={setModalPanelRef}
      afterOpenChange={handleAfterOpenChange}
      cancelButtonProps={{ hidden: hideCancelButton ?? !rest.cancelText }}
      footer={footer => (
        <div className={footerClass}>
          {onDelete && (
            <Button
              onClick={onDelete}
              type="primary"
              danger
              icon={<i className="fa fa-trash-o" aria-hidden="true" />}
              aria-label="Xóa"
            >
              Xóa
            </Button>
          )}
          <div className="flex gap-2">{footer}</div>
        </div>
      )}
      styles={mergedStyles}
      classNames={{
        header: 'app-modal-header',
        footer: onDelete ? 'app-modal-footer-with-delete' : undefined,
      }}
      destroyOnHidden
      rootClassName="app-modal-root"
      okText="Áp dụng"
      okButtonProps={{
        icon: <i className="fa fa-paper-plane-o" aria-hidden="true"></i>,
        hidden: !rest.onOk,
      }}
      {...rest}
    />
  );
};

export default React.memo(AppModal);
