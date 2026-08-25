import { useMemo, useState } from 'react';
import { Alert, Card, Spin } from 'antd';
import dayjs from 'dayjs';
import { PageHeader } from '@/shared/components/layout/page-header';
import { useAppToast } from '@/shared/hooks/use-app-toast';
import { useAdminPermissions } from '@/admin/modules/auth/hooks/use-admin-permissions';
import { AssignmentFormModal } from '@/admin/modules/schedule/components/assignment-form-modal';
import { ScheduleLegend } from '@/admin/modules/schedule/components/schedule-legend';
import { ScheduleToolbar } from '@/admin/modules/schedule/components/schedule-toolbar';
import { ShiftCalendar } from '@/admin/modules/schedule/components/shift-calendar';
import { StaffPool } from '@/admin/modules/schedule/components/staff-pool';
import {
  useSchedulableStaff,
  useScheduleCalendar,
} from '@/admin/modules/schedule/hooks/use-schedule-calendar';
import { useScheduleMutations } from '@/admin/modules/schedule/hooks/use-schedule-mutations';
import { DEFAULT_SLOT, weekRangeOf } from '@/admin/modules/schedule/utils/schedule.util';
import type {
  ShiftAssignment,
  ShiftAssignmentFormValues,
  ShiftSlot,
} from '@/admin/modules/schedule/types/schedule.type';

export function SchedulePage() {
  const toast = useAppToast();
  const { can } = useAdminPermissions();
  const [anchor, setAnchor] = useState(() => dayjs());
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ShiftAssignment | null>(null);
  const [formDefaults, setFormDefaults] = useState<{ workDate: string; slot: ShiftSlot } | null>(
    null,
  );

  const range = useMemo(() => weekRangeOf(anchor), [anchor]);
  const { data, isLoading } = useScheduleCalendar(range);
  const { data: staff = [], isLoading: staffLoading } = useSchedulableStaff();
  const { create, update, remove } = useScheduleMutations();

  const canCreate = can('schedule.create');
  const canUpdate = can('schedule.update');
  const canDelete = can('schedule.delete');

  const assignments = data?.assignments ?? [];
  const settings = data?.settings ?? [];

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setFormDefaults(null);
  };

  const openCreateForm = (workDate: string, slot: ShiftSlot) => {
    // Người chỉ có quyền xem bấm vào lịch thì không mở form, tránh điền xong mới báo lỗi.
    if (!canCreate) return;

    setEditing(null);
    setFormDefaults({ workDate, slot });
    setFormOpen(true);
  };

  const handleMove = async (assignment: ShiftAssignment, workDate: string, slot: ShiftSlot) => {
    await update.mutateAsync({
      id: assignment.id,
      values: {
        staffId: assignment.staff.id,
        workDate,
        slot,
        role: assignment.role,
        note: assignment.note,
      },
    });

    toast.success('Đã cập nhật ca.');
  };

  // Kéo thả là lối tắt cho trường hợp hay gặp nhất — nguyên ca. Muốn nửa ca thì
  // bấm thẳng vào khung giờ để mở form, hoặc bấm vào ca đã xếp để sửa.
  const handleDropStaff = async (staffId: number, workDate: string) => {
    await create.mutateAsync({ staffId, workDate, slot: DEFAULT_SLOT });
    toast.success('Đã xếp ca.');
  };

  const handleSubmit = async (values: ShiftAssignmentFormValues) => {
    if (editing) {
      await update.mutateAsync({ id: editing.id, values });
      toast.success('Đã cập nhật ca.');
    } else {
      await create.mutateAsync(values);
      toast.success('Đã xếp ca.');
    }

    closeForm();
  };

  const handleDelete = async () => {
    if (!editing) return;

    await remove.mutateAsync(editing.id);
    toast.success('Đã gỡ ca.');
    closeForm();
  };

  return (
    <div className="schedule-page">
      <PageHeader
        title="Lịch làm việc"
        subtitle={
          canUpdate
            ? 'Kéo nhân viên từ danh sách bên phải vào lịch, hoặc kéo một ca sang ngày khác để đổi lịch.'
            : 'Lịch ca của quán trong tuần.'
        }
      />

      <ScheduleToolbar
        weekStart={range.from}
        weekEnd={range.to}
        view={view}
        canEdit={canCreate}
        onChangeWeek={(offset) => setAnchor((current) => current.add(offset, 'week'))}
        onToday={() => setAnchor(dayjs())}
        onChangeView={setView}
        onCreate={() => openCreateForm(range.from, DEFAULT_SLOT)}
      />

      {settings.length === 0 && !isLoading ? (
        <Alert
          type="warning"
          showIcon
          message="Chưa cấu hình giờ mở ca"
          description="Chạy seeder ShiftSettingSeeder để tạo hai khung ca mặc định."
        />
      ) : null}

      <div className="schedule-page__body">
        <Card className="schedule-page__calendar" styles={{ body: { padding: 12 } }}>
          {isLoading ? (
            <div className="schedule-page__loading">
              <Spin />
            </div>
          ) : (
            <ShiftCalendar
              weekStart={range.from}
              assignments={assignments}
              settings={settings}
              editable={canUpdate}
              compact={view === 'list'}
              onSelectAssignment={(assignment) => {
                if (!assignment.locked && !canUpdate && !canDelete) return;

                setEditing(assignment);
                setFormOpen(true);
              }}
              onPickEmptySlot={openCreateForm}
              onMoveAssignment={handleMove}
              onDropStaff={handleDropStaff}
            />
          )}
        </Card>

        <div className="schedule-page__side">
          {canCreate ? <StaffPool staff={staff} loading={staffLoading} /> : null}
          <ScheduleLegend weekStart={range.from} assignments={assignments} settings={settings} />
        </div>
      </div>

      <AssignmentFormModal
        open={formOpen}
        staff={staff}
        editing={editing}
        defaultDate={formDefaults?.workDate ?? range.from}
        defaultSlot={formDefaults?.slot ?? DEFAULT_SLOT}
        submitting={create.isPending || update.isPending}
        deleting={remove.isPending}
        readOnly={editing?.locked ?? false}
        onCancel={closeForm}
        onSubmit={(values) => {
          void handleSubmit(values);
        }}
        onDelete={
          canDelete
            ? () => {
                void handleDelete();
              }
            : undefined
        }
      />
    </div>
  );
}
