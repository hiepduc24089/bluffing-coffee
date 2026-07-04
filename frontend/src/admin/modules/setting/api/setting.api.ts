import { http } from '@/shared/lib/http';
import type { PaginatedResponse } from '@/shared/types/api';
import { getAdminAuthHeaders } from '@/admin/modules/auth/utils/admin-auth-storage';
import type {
  BannerFilter,
  BannerFormValues,
  BannerRow,
  ContentPageFilter,
  ContentPageFormValues,
  ContentPageRow,
  UploadedSettingImage,
} from '@/admin/modules/setting/types/setting.type';

export const settingQueryKeys = {
  all: ['settings'] as const,
  contentPages: (filters: ContentPageFilter) => [...settingQueryKeys.all, 'content-pages', filters] as const,
  banners: (filters: BannerFilter) => [...settingQueryKeys.all, 'banners', filters] as const,
};

export async function getContentPages(filters: ContentPageFilter): Promise<PaginatedResponse<ContentPageRow>> {
  const response = await http.get<PaginatedResponse<ContentPageRow>>('/admin/content-pages', {
    headers: getAdminAuthHeaders(),
    params: {
      type: filters.type,
      search: filters.keyword || undefined,
      page: filters.page,
      per_page: filters.perPage,
    },
  });

  return response.data;
}

export async function createContentPage(payload: ContentPageFormValues): Promise<ContentPageRow> {
  const response = await http.post<{ data: ContentPageRow }>('/admin/content-pages', payload, {
    headers: getAdminAuthHeaders(),
  });

  return response.data.data;
}

export async function updateContentPage(id: number, payload: ContentPageFormValues): Promise<ContentPageRow> {
  const response = await http.put<{ data: ContentPageRow }>(`/admin/content-pages/${id}`, payload, {
    headers: getAdminAuthHeaders(),
  });

  return response.data.data;
}

export async function deleteContentPage(id: number): Promise<void> {
  await http.delete(`/admin/content-pages/${id}`, {
    headers: getAdminAuthHeaders(),
  });
}

export async function getBanners(filters: BannerFilter): Promise<PaginatedResponse<BannerRow>> {
  const response = await http.get<PaginatedResponse<BannerRow>>('/admin/banners', {
    headers: getAdminAuthHeaders(),
    params: {
      search: filters.keyword || undefined,
      page: filters.page,
      per_page: filters.perPage,
    },
  });

  return response.data;
}

export async function createBanner(payload: BannerFormValues): Promise<BannerRow> {
  const response = await http.post<{ data: BannerRow }>('/admin/banners', payload, {
    headers: getAdminAuthHeaders(),
  });

  return response.data.data;
}

export async function updateBanner(id: number, payload: BannerFormValues): Promise<BannerRow> {
  const response = await http.put<{ data: BannerRow }>(`/admin/banners/${id}`, payload, {
    headers: getAdminAuthHeaders(),
  });

  return response.data.data;
}

export async function deleteBanner(id: number): Promise<void> {
  await http.delete(`/admin/banners/${id}`, {
    headers: getAdminAuthHeaders(),
  });
}

export async function uploadSettingImage(
  image: File,
  directory: 'settings/posts' | 'settings/events' | 'settings/banners' | 'settings/content',
): Promise<UploadedSettingImage> {
  const formData = new FormData();
  formData.append('image', image);
  formData.append('directory', directory);

  const response = await http.post<{ data: UploadedSettingImage }>('/admin/setting-images', formData, {
    headers: {
      ...getAdminAuthHeaders(),
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.data;
}
