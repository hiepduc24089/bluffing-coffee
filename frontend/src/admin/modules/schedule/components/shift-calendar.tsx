import { useEffect, useMemo, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import { LockOutlined } from '@ant-design/icons';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';
import viLocale from '@fullcalendar/core/locales/vi';
import type { EventContentArg, EventDropArg, EventInput } from '@fullcalendar/core';
import type { DateClickArg, DropArg } from '@fullcalendar/interaction';
import dayjs from 'dayjs';
import {
  LOCKED_COLORS,
  POSITION_COLORS,
  settingOf,
  slotAtTime,
} from '@/admin/modules/schedule/utils/schedule.util';
import type {
  ShiftAssignment,
  ShiftSetting,
  ShiftSlot,
} from '@/admin/modules/schedule/types/schedule.type';

type ShiftCalendarProps = {
  weekStart: string;
  assignments: ShiftAssignment[];
  settings: ShiftSetting[];
  editable: boolean;
  compact: boolean;
  onSelectAssignment: (assignment: ShiftAssignment) => void;
  onPickEmptySlot: (workDate: string, slot: ShiftSlot) => void;
  onMoveAssignment: (
    assignment: ShiftAssignment,
    workDate: string,
    slot: ShiftSlot,
  ) => Promise<unknown>;
  onDropStaff: (staffId: number, workDate: string) => Promise<unknown>;
};

/**
 * Lịch chỉ hiển thị khoảng 12h–22h vì quán không mở sớm hơn; khung giờ hẹp giúp
 * các ca cao hẳn lên, nhìn phát biết ai Full-time ai Part-time.
 */
const CALENDAR_OPEN_TIME = '12:00:00';
const CALENDAR_CLOSE_TIME = '22:00:00';

/**
 * Locale `vi` của FullCalendar in thứ theo kiểu "Thứ 2 17/8"; quán quen đọc
 * "Thứ 2 (17/08)" nên tự dựng nhãn thay vì phụ thuộc locale.
 */
const WEEKDAY_LABELS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

export function ShiftCalendar({
  weekStart,
  assignments,
  settings,
  editable,
  compact,
  onSelectAssignment,
  onPickEmptySlot,
  onMoveAssignment,
  onDropStaff,
}: ShiftCalendarProps) {
  const calendarRef = useRef<FullCalendar | null>(null);

  useEffect(() => {
    calendarRef.current?.getApi().gotoDate(weekStart);
  }, [weekStart]);

  const events = useMemo<EventInput[]>(
    () =>
      assignments.map((assignment) => {
        const colors = assignment.locked ? LOCKED_COLORS : POSITION_COLORS[assignment.role];
        const classNames = ['shift-event'];

        if (assignment.locked) classNames.push('shift-event--locked');

        return {
          id: String(assignment.id),
          title: assignment.staff.name,
          start: assignment.startAt.replace(' ', 'T'),
          end: assignment.endAt.replace(' ', 'T'),
          backgroundColor: colors.background,
          borderColor: colors.border,
          textColor: '#ffffff',
          classNames,
          // Ca đã chốt lương không kéo đi đâu được, kể cả khi lịch đang ở chế độ sửa.
          startEditable: !assignment.locked,
          extendedProps: { assignment },
        };
      }),
    [assignments],
  );

  const handleEventDrop = (info: EventDropArg) => {
    const assignment = info.event.extendedProps.assignment as ShiftAssignment;
    const droppedAt = dayjs(info.event.start ?? undefined);
    const workDate = droppedAt.format('YYYY-MM-DD');
    const setting = settingOf(settings, workDate);

    if (!setting) {
      info.revert();
      return;
    }

    // Bỏ qua giờ thả thô: ca chỉ có 3 khung cố định nên quy về khung gần nhất.
    const slot: ShiftSlot =
      assignment.slot === 'full' ? 'full' : slotAtTime(setting, workDate, droppedAt);

    void onMoveAssignment(assignment, workDate, slot).catch(() => info.revert());
  };

  const handleExternalDrop = (info: DropArg) => {
    const staffId = Number(info.draggedEl.dataset.staffId);

    if (!staffId) return;

    void onDropStaff(staffId, dayjs(info.date).format('YYYY-MM-DD'));
  };

  // Bấm vào ô giờ trống: mở form thêm ca với đúng ngày và nửa ca vừa bấm.
  const handleDateClick = (info: DateClickArg) => {
    const clickedAt = dayjs(info.date);
    const workDate = clickedAt.format('YYYY-MM-DD');
    const setting = settingOf(settings, workDate);

    if (!setting) return;

    onPickEmptySlot(workDate, slotAtTime(setting, workDate, clickedAt));
  };

  const renderEvent = (arg: EventContentArg) => {
    const assignment = arg.event.extendedProps.assignment as ShiftAssignment;

    return (
      <div className="shift-event__body">
        <span className="shift-event__name">
          {assignment.locked ? <LockOutlined className="shift-event__lock" /> : null}
          {assignment.staff.name}
        </span>
        <span className="shift-event__meta">{assignment.roleLabel}</span>
        <span className="shift-event__meta">{arg.timeText}</span>
      </div>
    );
  };

  return (
    <FullCalendar
      ref={calendarRef}
      plugins={[timeGridPlugin, listPlugin, interactionPlugin]}
      initialView={compact ? 'listWeek' : 'timeGridWeek'}
      initialDate={weekStart}
      locale={viLocale}
      headerToolbar={false}
      allDaySlot={false}
      firstDay={1}
      slotMinTime={CALENDAR_OPEN_TIME}
      slotMaxTime={CALENDAR_CLOSE_TIME}
      slotDuration="01:00:00"
      // Mặc định locale vi ra "12 giờ", đổi sang "12:00" cho khớp cách ghi giờ ca.
      slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
      dayHeaderContent={(arg) => {
        const date = dayjs(arg.date);

        return `${WEEKDAY_LABELS[date.day()]} (${date.format('DD/MM')})`;
      }}
      expandRows
      height="auto"
      events={events}
      editable={editable}
      droppable={editable}
      eventStartEditable={editable}
      // Độ dài ca do slot quyết định, không cho co giãn tự do.
      eventDurationEditable={false}
      eventDrop={handleEventDrop}
      drop={handleExternalDrop}
      dateClick={handleDateClick}
      eventClick={(info) => onSelectAssignment(info.event.extendedProps.assignment as ShiftAssignment)}
      eventContent={renderEvent}
      noEventsText="Chưa xếp ca nào trong tuần này."
    />
  );
}
