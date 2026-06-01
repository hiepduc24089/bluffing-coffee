import { Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { adminAuthQueryKeys, getAdminMe } from '@/admin/modules/auth/api/admin-auth.api';
import {
  clearAdminAuthToken,
  getAdminAuthToken,
} from '@/admin/modules/auth/utils/admin-auth-storage';

export function RequireAdminAuth() {
  const location = useLocation();
  const token = getAdminAuthToken();

  const { isLoading, isError } = useQuery({
    queryKey: adminAuthQueryKeys.me,
    queryFn: getAdminMe,
    enabled: Boolean(token),
    retry: false,
  });

  if (!token) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  if (isLoading) {
    return (
      <div className="auth-loading">
        <Spin />
      </div>
    );
  }

  if (isError) {
    clearAdminAuthToken();
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
