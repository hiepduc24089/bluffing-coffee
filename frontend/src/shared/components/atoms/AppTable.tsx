import { Empty, Table, Tooltip } from 'antd';
import type { TableProps, TableColumnType } from 'antd';
import React, { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAntdTableSortOrder } from '@/utils/antdTableSortOrder';

const EMPTY_TEXT_FILTERED = 'Không tìm thấy kết quả phù hợp.';
const EMPTY_TEXT_DEFAULT = 'Không có dữ liệu.';

/** Params that are NOT search/filter criteria — excluded from "has filters" check */
const DEFAULT_NON_FILTER_PARAMS = new Set([
  'page',
  'per_page',
  'sort_by',
  'sort_dir',
  'sort_field',
  'sort_type',
  'order',
  'tab',
]);

export type NonFilterParamsInput = string[] | ((defaults: Set<string>) => Set<string>);

export type AppTableProps<RecordType extends object = any> = TableProps<RecordType> & {
  recordCount?: number;
  dragTextName?: string;
  nonFilterParams?: NonFilterParamsInput;
  customLabelTotal?: string;
  enableEllipsis?: boolean;
  hasFilters?: boolean | null;
};

const AppTableComponent = React.forwardRef<HTMLDivElement, AppTableProps<any>>(
  ({ ...props }, ref) => {
    const [searchParams] = useSearchParams();

    const excludedParams = useMemo(() => {
      if (!props.nonFilterParams) return DEFAULT_NON_FILTER_PARAMS;
      if (Array.isArray(props.nonFilterParams)) return new Set(props.nonFilterParams);
      return props.nonFilterParams(DEFAULT_NON_FILTER_PARAMS);
    }, [props.nonFilterParams]);

    const hasSearchFilters = Array.from(searchParams.keys()).some(key => !excludedParams.has(key));

    const {
      bordered = true,
      size = 'middle',
      pagination = false,
      scroll,
      columns,
      dataSource,
      recordCount: customRecordCount,
      dragTextName = 'danh sách',
      onChange: onChangeExternal,
      locale,
      nonFilterParams: _nonFilterParams,
      customLabelTotal,
      hasFilters: hasFiltersProp = null,
      enableEllipsis = false,
      ...rest
    } = props;
    const applyEllipsis = enableEllipsis;

    const hasFilters =
      hasFiltersProp !== null && hasFiltersProp !== undefined ? hasFiltersProp : hasSearchFilters;

    // Internal sort state
    const [activeSortField, setActiveSortField] = useState<string>('');
    const [activeSortOrder, setActiveSortOrder] = useState<'asc' | 'desc'>('asc');

    const hasDrag = !!(props.components?.body as any)?.row;

    // Apply sortOrder to columns with sorter: true + ellipsis with tooltip
    const enhancedColumns = useMemo(() => {
      return columns?.map(column => {
        const col = { ...column } as TableColumnType<any>;
        const originalOnHeaderCell = col.onHeaderCell;

        col.onHeaderCell = column => {
          const original = originalOnHeaderCell ? originalOnHeaderCell(column) : {};

          return {
            ...original,
            style: {
              whiteSpace: 'nowrap',
              ...original.style,
            },
          };
        };

        // Add sortOrder for sortable columns (skip if already set externally)
        if (col.sorter === true && col.key && !('sortOrder' in column)) {
          col.sortOrder = getAntdTableSortOrder(
            activeSortField,
            col.key as string,
            activeSortOrder
          );
        }

        // Apply ellipsis + tooltip when applyEllipsis flag is on
        if (!applyEllipsis || (col as any).ellipsisTooltip === false) return col;

        // BD: bảng phải fit container, không hiển thị scroll ngang.
        // Khi enableEllipsis → bỏ col.width của các cột data (>= 80px) để
        // Ant Design tự auto-distribute. Cell dài quá → ellipsis + tooltip.
        // Giữ width của cột UI nhỏ (checkbox, icon) — width < 80px.
        if (enableEllipsis && typeof col.width === 'number' && col.width >= 80) {
          delete col.width;
        }

        // Set maxWidth on cell to limit width (admin mode — giữ behavior cũ)
        if (col.width) {
          const originalOnCell = col.onCell;
          col.onCell = (record: any, index?: number) => {
            const original = originalOnCell ? originalOnCell(record, index) : {};
            return {
              ...original,
              style: {
                maxWidth: col.width,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                ...(original as any).style,
              },
            };
          };
        }

        // Wrap cell content with single-line ellipsis + scrollable tooltip
        const originalRender = col.render;
        col.ellipsis = { showTitle: false };
        col.render = (value: any, record: any, index: number) => {
          const content = originalRender ? originalRender(value, record, index) : value;
          // Skip tooltip for React elements (e.g. action buttons)
          if (React.isValidElement(content)) return content;
          const text = content == null ? '' : String(content);
          return (
            <Tooltip
              title={
                <div style={{ maxHeight: 200, overflowY: 'auto', pointerEvents: 'auto' }}>
                  {text}
                </div>
              }
              placement="topLeft"
              styles={{ root: { pointerEvents: 'none', maxWidth: 400 } }}
            >
              <span>{text}</span>
            </Tooltip>
          );
        };

        return col;
      });
    }, [columns, activeSortField, activeSortOrder, applyEllipsis, enableEllipsis]);

    // Handle table change event
    const handleTableChange = useCallback(
      (pagination: any, filters: any, sorter: any, extra: any) => {
        const sort = Array.isArray(sorter) ? sorter[0] : sorter;
        // Prefer columnKey (stable, equals column.key) over field (which may be dataIndex array)
        const sortField = sort?.columnKey ?? sort?.field;

        // Two-state toggle: ascend ↔ descend (kills antd's 3rd-click null state).
        // On 3rd click, sort.order is null and sort.columnKey is null — flip direction
        // on the remembered field and synthesize a sorter so external handlers update too.
        if (sortField && sort?.order) {
          const sortOrder = sort.order === 'descend' ? 'desc' : 'asc';
          setActiveSortField(String(sortField));
          setActiveSortOrder(sortOrder as 'asc' | 'desc');
          if (onChangeExternal) {
            onChangeExternal(pagination, filters, sorter, extra);
          }
        } else if (activeSortField) {
          const flippedOrder: 'asc' | 'desc' = activeSortOrder === 'asc' ? 'desc' : 'asc';
          setActiveSortOrder(flippedOrder);
          if (onChangeExternal) {
            const flippedSorter = {
              ...(sort || {}),
              columnKey: activeSortField,
              field: activeSortField,
              order: flippedOrder === 'desc' ? 'descend' : 'ascend',
            };
            onChangeExternal(pagination, filters, flippedSorter, extra);
          }
        }
      },
      [onChangeExternal, activeSortField, activeSortOrder]
    );

    return (
      <div ref={ref} className="app-table-ra2n">
        {customRecordCount !== undefined && (
          <div className="mb-4 text-sm text-gray-600">
            {customLabelTotal || 'Tổng số bản ghi'}: {customRecordCount}
          </div>
        )}
        {hasDrag && (
          <div className="text-red-600 text-[14px] mb-4">
            Kéo thả biểu tượng [≡] để thay đổi thứ tự hiển thị của {dragTextName}.
          </div>
        )}
        <Table
          bordered={bordered}
          size={size}
          pagination={pagination}
          showSorterTooltip={false}
          scroll={scroll ?? { x: true }}
          dataSource={dataSource}
          columns={enhancedColumns}
          onChange={handleTableChange}
          {...rest}
          locale={
            locale ?? {
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={hasFilters ? EMPTY_TEXT_FILTERED : EMPTY_TEXT_DEFAULT}
                />
              ),
            }
          }
        />
      </div>
    );
  }
);

AppTableComponent.displayName = 'AppTable';

const AppTable = AppTableComponent as <RecordType extends object = any>(
  props: AppTableProps<RecordType> & { ref?: React.Ref<HTMLDivElement> }
) => React.ReactElement;

export default AppTable;
