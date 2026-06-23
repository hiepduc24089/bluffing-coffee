import { Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getMainMe, mainAuthQueryKeys } from '@/main/modules/auth/api/main-auth.api';
import {
  clearMainAuthToken,
  getMainAuthToken,
} from '@/main/modules/auth/utils/main-auth-storage';

export function RequireMainAuth() {
  const location = useLocation();
  const token = getMainAuthToken();

  const { isLoading, isError } = useQuery({
    queryKey: mainAuthQueryKeys.me,
    queryFn: getMainMe,
    enabled: Boolean(token),
    retry: false,
  });

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (isLoading) {
    return (
      <div className="auth-loading">
        <Spin />
      </div>
    );
  }

  if (isError) {
    clearMainAuthToken();
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
