import { Space, Typography } from 'antd';
import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  extra?: ReactNode;
};

export function PageHeader({ title, subtitle, extra }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        <Typography.Title level={2} className="page-header__title">
          {title}
        </Typography.Title>
        {subtitle ? (
          <Typography.Paragraph type="secondary" className="page-header__subtitle">
            {subtitle}
          </Typography.Paragraph>
        ) : null}
      </div>
      {extra ? <Space>{extra}</Space> : null}
    </div>
  );
}
