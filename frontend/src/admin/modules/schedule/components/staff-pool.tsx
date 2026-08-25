import { useEffect, useRef } from 'react';
import { Draggable } from '@fullcalendar/interaction';
import { Card, Empty, Typography } from 'antd';
import { POSITION_COLORS } from '@/admin/modules/schedule/utils/schedule.util';
import type {
  SchedulableStaff,
  StaffPosition,
} from '@/admin/modules/schedule/types/schedule.type';

type StaffPoolProps = {
  staff: SchedulableStaff[];
  loading?: boolean;
};

const GROUPS: Array<{ position: StaffPosition; label: string }> = [
  { position: 'barista', label: 'Pha chế' },
  { position: 'dealer', label: 'Dealer' },
];

/**
 * Kéo thẻ nhân viên vào lịch. `create: false` để FullCalendar không tự vẽ một ca
 * ảo — ca chỉ xuất hiện sau khi backend duyệt xong sức chứa và trả về dữ liệu.
 */
export function StaffPool({ staff, loading }: StaffPoolProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const draggable = new Draggable(containerRef.current, {
      itemSelector: '.staff-pool__card',
      eventData: () => ({ create: false }),
    });

    return () => draggable.destroy();
  }, []);

  return (
    <Card title="Nhân viên" size="small" loading={loading} className="staff-pool">
      <div ref={containerRef}>
        {staff.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Chưa có nhân viên nào được gán vị trí."
          />
        ) : null}

        {GROUPS.map((group) => {
          const members = staff.filter((member) => member.position === group.position);

          if (members.length === 0) return null;

          return (
            <div key={group.position} className="staff-pool__group">
              <Typography.Text type="secondary" className="staff-pool__group-title">
                {group.label}
              </Typography.Text>

              {members.map((member) => (
                <div
                  key={member.id}
                  className="staff-pool__card"
                  data-staff-id={member.id}
                  style={{ borderLeftColor: POSITION_COLORS[group.position].background }}
                >
                  <span className="staff-pool__name">{member.name}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
