import { ConfigProvider } from 'antd';
import { RouterProvider } from 'react-router-dom';
import { appRouter } from '@/routes';
import { AppToastBridge } from '@/shared/components/AppToastBridge';
import { useDocumentTitle } from '@/shared/hooks/use-document-title';

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
  components: {
    // Tooltips sit on the dark spotlight background, so they keep white text
    // instead of inheriting the near-black solid text used by gold buttons.
    Tooltip: {
      colorTextLightSolid: '#ffffff',
    },
  },
};

export default function App() {
  useDocumentTitle();

  return (
    <ConfigProvider theme={brandTheme}>
      <AppToastBridge />
      <RouterProvider router={appRouter} />
    </ConfigProvider>
  );
}
