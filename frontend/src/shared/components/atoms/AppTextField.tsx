import { Input, Space } from 'antd';
import type { InputProps, InputRef } from 'antd';
import React, { forwardRef } from 'react';

export type AppTextFieldProps = Omit<InputProps, 'addonBefore' | 'addonAfter'> & {
  addonBefore?: React.ReactNode;
  addonAfter?: React.ReactNode;
  addonbefore?: React.ReactNode;
  addonafter?: React.ReactNode;
  tooltip?: boolean | React.ReactNode;
};

const AppTextField = forwardRef<InputRef, AppTextFieldProps>((props, ref) => {
  const {
    addonAfter: _addonAfter,
    addonBefore: _addonBefore,
    addonbefore,
    addonafter,
    tooltip,
    onPressEnter: callerOnPressEnter,
    onKeyDown: callerOnKeyDown,
    ...rest
  } = props as AppTextFieldProps & { onKeyDown?: React.KeyboardEventHandler<HTMLInputElement> };

  const addonAfter = _addonAfter ?? addonafter;
  const addonBefore = _addonBefore ?? addonbefore;

  const inputProps: InputProps = {
    ...(rest as InputProps),
    onPressEnter: callerOnPressEnter,
    ...(tooltip !== undefined ? { tooltip } : {}),
    ...(callerOnKeyDown != null ? { onKeyDown: callerOnKeyDown } : {}),
  };

  if (addonBefore || addonAfter) {
    return (
      <Space.Compact>
        {addonBefore ? <span className="px-2">{addonBefore}</span> : null}
        <Input ref={ref} {...inputProps} />
        {addonAfter ? <span className="px-2">{addonAfter}</span> : null}
      </Space.Compact>
    );
  }

  return <Input ref={ref} {...inputProps} />;
});

AppTextField.displayName = 'AppTextField';

export default AppTextField;
