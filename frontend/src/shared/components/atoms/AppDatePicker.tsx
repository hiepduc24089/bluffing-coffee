import React, { useMemo } from 'react';
import { DatePicker } from 'antd';
import type { DatePickerProps } from 'antd';
import dayjs from 'dayjs';
import viVN from 'antd/locale/vi_VN';
import 'dayjs/locale/vi';

export type AppDatePickerProps = Omit<DatePickerProps, 'value'> & {
  value?: DatePickerProps['value'] | string | null;
};

dayjs.locale('vi');

const AppDatePicker = React.forwardRef<any, AppDatePickerProps>(
  ({ format, value, className, picker, ...props }, ref) => {
    const isYearPicker = picker === 'year';
    const isMonthPicker = picker === 'month';

    const defaultFormat = useMemo(() => {
      if (isYearPicker) return 'YYYY';
      if (isMonthPicker) return 'YYYY-MM';
      return 'YYYY-MM-DD';
    }, [isYearPicker, isMonthPicker]);

    const activeFormat = format || defaultFormat;

    const dayjsValue = useMemo(() => {
      if (!value) return undefined;
      if (typeof value === 'string') {
        const parsed = dayjs(value);
        return parsed.isValid() ? parsed : undefined;
      }
      return value as dayjs.Dayjs;
    }, [value]);

    return (
      <DatePicker
        ref={ref}
        picker={picker}
        format={activeFormat}
        value={dayjsValue}
        locale={viVN.DatePicker}
        className={`!h-[40px] ${className ?? ''}`}
        suffixIcon={<i className="fa fa-calendar-o" aria-hidden="true" />}
        {...props}
      />
    );
  }
);

AppDatePicker.displayName = 'AppDatePicker';

export default AppDatePicker;
