import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface AppToastContentProps {
  type: ToastType;
  message: string;
  showIcon?: boolean;
}

const toastConfig: Record<ToastType, { icon: ReactNode; className: string }> = {
  info: {
    icon: <InfoCircleOutlined />,
    className: 'app-toast-content--info',
  },
  success: {
    icon: <CheckCircleOutlined />,
    className: 'app-toast-content--success',
  },
  warning: {
    icon: <ExclamationCircleOutlined />,
    className: 'app-toast-content--warning',
  },
  error: {
    icon: <CloseCircleOutlined />,
    className: 'app-toast-content--error',
  },
};

export default function AppToastContent({
  type,
  message,
  showIcon = true,
}: AppToastContentProps) {
  const config = toastConfig[type];

  return (
    <div className={`app-toast-content ${config.className}`}>
      <div className="app-toast-content__inner">
        {showIcon ? <span className="app-toast-content__icon">{config.icon}</span> : null}
        <p className="app-toast-content__message">{message}</p>
      </div>
    </div>
  );
}
