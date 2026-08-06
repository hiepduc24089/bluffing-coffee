import { ConfigProvider, theme } from 'antd';
import type { ReactNode } from 'react';

export const BRAND_YELLOW = '#f3d680';

/**
 * The clock runs on venue TVs in a dark room, so Ant Design defaults (light
 * surfaces, blue primary) are swapped for the yellow-on-black brand palette.
 */
export function ClockBrandTheme({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: BRAND_YELLOW,
          colorLink: BRAND_YELLOW,
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
