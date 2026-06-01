import { Button } from 'antd';
import type { ButtonProps } from 'antd';
import React from 'react';

export type AppButtonProps = ButtonProps & {
  type?: ButtonProps['type'];
  size?: ButtonProps['size'];
};

const AppButton = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, AppButtonProps>(
  ({ type = 'default', size = 'middle', ...props }, ref) => (
    <Button ref={ref} type={type} size={size} {...props} />
  )
);

AppButton.displayName = 'AppButton';

export default AppButton;
