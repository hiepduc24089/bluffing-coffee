import { ConfigProvider } from 'antd';
import { RouterProvider } from 'react-router-dom';
import { appRouter } from '@/routes';
import { AppToastBridge } from '@/shared/components/AppToastBridge';

/**
 * Brand palette sampled from the chip logo. Primary surfaces are the pale gold,
 * so solid buttons carry near-black text instead of Ant Design's default white.
 */
const brandTheme = {
  token: {
    colorPrimary: '#f3d680',
    colorPrimaryHover: '#e8c55c',
    colorTextLightSolid: '#101010',
    colorLink: '#8a6d1f',
    colorLinkHover: '#c9a227',
  },
};

export default function App() {
  return (
    <ConfigProvider theme={brandTheme}>
      <AppToastBridge />
      <RouterProvider router={appRouter} />
    </ConfigProvider>
  );
}
