import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Empty, Spin, Tag, Typography } from 'antd';
import AppCheckbox from '@/shared/components/atoms/AppCheckbox';
import AppModal from '@/shared/components/atoms/AppModal';
import AppSelect from '@/shared/components/atoms/AppSelect';
import {
  getLiveTableTournamentOverview,
  liveTableQueryKeys,
} from '@/admin/modules/live-table/api/live-table.api';
import type {
  LiveTableKey,
  LiveTableSeatingStrategy,
  MergeLiveTablesPayload,
} from '@/admin/modules/live-table/types/live-table.type';

const MAX_SEATS = 9;

const strategyOptions: { label: string; value: LiveTableSeatingStrategy }[] = [
  { label: 'Bốc thăm ngẫu nhiên', value: 'random' },
  { label: 'Xếp lần lượt vào ghế trống', value: 'sequential' },
];

type MergeLiveTablesModalProps = {
  open: boolean;
  targetTableKey: LiveTableKey;
  targetTableName: string;
  tournamentId?: string;
  submitting?: boolean;
  onSubmit: (payload: Omit<MergeLiveTablesPayload, 'tournamentId'>) => void;
  onClose: () => void;
};

export function MergeLiveTablesModal({
  open,
  targetTableKey,
  targetTableName,
  tournamentId,
  submitting,
  onSubmit,
  onClose,
}: MergeLiveTablesModalProps) {
  const [sourceTableKeys, setSourceTableKeys] = useState<LiveTableKey[]>([]);
  const [seatingStrategy, setSeatingStrategy] = useState<LiveTableSeatingStrategy>('random');

  const overviewQuery = useQuery({
    queryKey: liveTableQueryKeys.overview(tournamentId as string),
    queryFn: () => getLiveTableTournamentOverview(tournamentId as string),
    enabled: open && Boolean(tournamentId),
  });

  const overview = overviewQuery.data ?? [];
  const targetTable = overview.find((table) => table.key === targetTableKey);
  const sourceTables = overview.filter((table) => table.key !== targetTableKey);

  // Bàn nguồn đã bỏ chọn hoặc vừa hết người thì phải rơi khỏi lựa chọn, nếu không
  // người dùng bấm gom một bàn đã trống.
  useEffect(() => {
    if (!overviewQuery.data) return;

    setSourceTableKeys((current) =>
      current.filter((key) =>
        overviewQuery.data.some((table) => table.key === key && table.seats.length > 0),
      ),
    );
  }, [overviewQuery.data]);

  const { movingCount, totalAfterMerge } = useMemo(() => {
    const moving = sourceTables
      .filter((table) => sourceTableKeys.includes(table.key))
      .reduce((total, table) => total + table.seats.length, 0);

    return {
      movingCount: moving,
      totalAfterMerge: (targetTable?.seats.length ?? 0) + moving,
    };
  }, [sourceTableKeys, sourceTables, targetTable?.seats.length]);

  const isOverCapacity = totalAfterMerge > MAX_SEATS;
  const canSubmit = movingCount > 0 && !isOverCapacity;

  return (
    <AppModal
      isOpen={open}
      onClose={onClose}
      afterOpenChange={(isOpen) => {
        if (!isOpen) {
          setSourceTableKeys([]);
          setSeatingStrategy('random');
        }
      }}
      title={`Gom bàn về ${targetTableName}`}
      maxWidth="max-w-lg"
      okText="Gom bàn"
      cancelText="Hủy"
      confirmLoading={submitting}
      okButtonProps={{ disabled: !canSubmit || submitting }}
      onOk={() => {
        if (!canSubmit) return;
        onSubmit({ sourceTableKeys, seatingStrategy });
      }}
    >
      {overviewQuery.isLoading ? (
        <div className="live-merge__loading">
          <Spin />
        </div>
      ) : (
        <div className="live-merge">
          <Typography.Text type="secondary">
            Chọn bàn cần gom về <strong>{targetTableName}</strong>. Người chơi được chuyển sang ghế
            trống của bàn đích, các bàn nguồn sẽ được trả về trạng thái rảnh.
          </Typography.Text>

          {sourceTables.some((table) => table.seats.length > 0) ? (
            <div className="live-merge__list">
              {sourceTables.map((table) => {
                const playerCount = table.seats.length;
                const isEmpty = playerCount === 0;

                const isDisabled = isEmpty || Boolean(submitting);

                return (
                  <div
                    key={table.key}
                    className={`live-merge__row ${isDisabled ? 'live-merge__row--disabled' : ''}`}
                    // Toggle nằm ở cả hàng cho dễ bấm; checkbox chỉ hiển thị trạng thái
                    // để một cú bấm không bị tính hai lần.
                    onClick={() => {
                      if (isDisabled) return;
                      setSourceTableKeys((current) =>
                        current.includes(table.key)
                          ? current.filter((key) => key !== table.key)
                          : [...current, table.key],
                      );
                    }}
                  >
                    <AppCheckbox
                      checked={sourceTableKeys.includes(table.key)}
                      disabled={isDisabled}
                      onChange={() => undefined}
                    />
                    <span className="live-merge__row-name">{table.name}</span>
                    <Tag color={isEmpty ? 'default' : 'gold'}>
                      {isEmpty ? 'Trống' : `${playerCount} người`}
                    </Tag>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Các bàn khác không còn người chơi nào của giải này"
            />
          )}

          <div className="live-merge__row live-merge__row--summary">
            <span className="live-merge__row-name">
              {targetTableName} sau khi gom
            </span>
            <Tag color={isOverCapacity ? 'red' : 'green'}>
              {totalAfterMerge}/{MAX_SEATS} ghế
            </Tag>
          </div>

          {isOverCapacity ? (
            <Alert
              type="error"
              showIcon
              message={`Vượt quá ${MAX_SEATS} ghế của bàn đích. Hãy bỏ bớt một bàn nguồn.`}
            />
          ) : null}

          <AppSelect
            value={seatingStrategy}
            onChange={(value) => setSeatingStrategy(value as LiveTableSeatingStrategy)}
            options={strategyOptions}
            disabled={submitting}
          />
        </div>
      )}
    </AppModal>
  );
}
