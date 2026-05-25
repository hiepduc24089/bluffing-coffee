import type { SortOrder } from 'antd/es/table/interface';

type ApiSortDirection = 'asc' | 'desc' | (string & {});

export function getAntdTableSortOrder(
  activeSortField: string,
  columnSortField: string,
  activeSortOrder: ApiSortDirection
): SortOrder | undefined {
  return activeSortField === columnSortField
    ? activeSortOrder === 'desc'
      ? 'descend'
      : 'ascend'
    : undefined;
}

