import { Radio as AntdRadio } from 'antd';
import type { RadioProps as AntdRadioProps } from 'antd';
import { forwardRef } from 'react';
import type { ElementRef } from 'react';

export type AppRadioProps = Omit<AntdRadioProps, 'ref'>;

type AntdRadioRef = ElementRef<typeof AntdRadio>;

const AppRadio = forwardRef<AntdRadioRef, AppRadioProps>((props, ref) => {
  return <AntdRadio ref={ref} {...props} />;
});

AppRadio.displayName = 'AppRadio';

export default AppRadio;
