import { Select, Tooltip } from 'antd';
import type {
  BaseOptionType,
  DefaultOptionType,
  RefSelectProps,
  SelectProps,
} from 'antd/es/select';
import React, { useRef, useState } from 'react';

const EllipsisLabel = ({
  text,
  style,
}: {
  text: string;
  style?: React.CSSProperties;
}): React.ReactElement => {
  const spanRef = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const handleMouseEnter = () => {
    const el = spanRef.current;
    if (el) setIsTruncated(el.scrollWidth > el.clientWidth);
  };

  return (
    <Tooltip title={isTruncated ? text : null}>
      <span
        ref={spanRef}
        className="block max-w-full truncate"
        style={style}
        onMouseEnter={handleMouseEnter}
      >
        {text}
      </span>
    </Tooltip>
  );
};

function normalizeOptions(options?: any[]) {
  if (!options) return options;

  return options.map(opt => {
    const label = opt?.label;

    if (typeof label === 'string' || typeof label === 'number') {
      return {
        ...opt,
        label: <EllipsisLabel text={String(label)} />,
      };
    }

    return opt;
  });
}

export type AppSelectProps<
  ValueType = unknown,
  OptionType extends BaseOptionType | DefaultOptionType = DefaultOptionType,
> = SelectProps<ValueType, OptionType>;

const AppSelect = React.forwardRef<RefSelectProps, AppSelectProps>((props, ref) => {
  const {
    allowClear = false,
    className,
    placeholder = 'Vui lòng chọn',
    options,
    ...rest
  } = props;

  const rootClassName = [
    '!h-[40px] min-w-0 max-w-full',
    '[&_.ant-select-selector]:min-w-0 [&_.ant-select-selector]:overflow-hidden',
    '[&_.ant-select-selection-item]:min-w-0 [&_.ant-select-selection-item]:max-w-full',
    '[&_.ant-select-selection-placeholder]:block [&_.ant-select-selection-placeholder]:truncate',
    // On touch devices hover never fires, so antd's clear button stays hidden.
    // Restrict forced visibility to coarse-pointer (touch) only — on desktop
    // hover handles it natively without overlapping the dropdown arrow.
    allowClear
      ? '[@media(pointer:coarse){&_.ant-select-clear}]:!opacity-100 [@media(pointer:coarse){&_.ant-select-clear}]:!pointer-events-auto'
      : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Select
      ref={ref}
      allowClear={allowClear}
      placeholder={placeholder}
      className={rootClassName}
      options={normalizeOptions(options)}
      {...rest}
    />
  );
});

AppSelect.displayName = 'AppSelect';

export default AppSelect;
