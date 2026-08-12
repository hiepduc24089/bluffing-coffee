export type ContentPageType = 'post' | 'event';

export type ContentPageRow = {
  id: number;
  type: ContentPageType;
  title: string;
  coverImage?: string | null;
  coverImageUrl?: string | null;
  content?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ContentPageFilter = {
  type: ContentPageType;
  keyword: string;
  page: number;
  perPage: number;
};

export type ContentPageFormValues = {
  type: ContentPageType;
  title: string;
  coverImage?: string | null;
  content?: string | null;
};

export type BannerRow = {
  id: number;
  title?: string | null;
  image: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type BannerFilter = {
  keyword: string;
  page: number;
  perPage: number;
};

export type BannerFormValues = {
  title?: string | null;
  image: string;
  linkUrl?: string | null;
  sortOrder: number;
};

export type UploadedSettingImage = {
  path: string;
  publicPath: string;
  url: string;
};
