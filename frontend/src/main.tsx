import React from 'react';
import ReactDOM from 'react-dom/client';
import { App as AntdApp, ConfigProvider } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import 'antd/dist/reset.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import '@fortawesome/fontawesome-free/css/v4-shims.min.css';
import './styles/global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#0f766e',
          borderRadius: 6,
          borderRadiusLG: 6,
          borderRadiusSM: 4,
        },
        components: {
          Button: {
            borderRadius: 6,
            borderRadiusLG: 6,
            borderRadiusSM: 4,
          },
          Input: {
            borderRadius: 6,
            borderRadiusLG: 6,
            borderRadiusSM: 4,
          },
          InputNumber: {
            borderRadius: 6,
          },
          Select: {
            borderRadius: 6,
          },
          DatePicker: {
            borderRadius: 6,
          },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AntdApp>
          <App />
        </AntdApp>
      </QueryClientProvider>
    </ConfigProvider>
  </React.StrictMode>,
);
