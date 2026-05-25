import React from 'react';
import { Checkbox } from 'antd';
import type { CheckboxProps } from 'antd';
import type { CheckboxGroupProps } from 'antd/es/checkbox';

export type AppCheckboxProps = CheckboxProps;

type AppCheckboxRef = React.ElementRef<typeof Checkbox>;

type CompoundedComponent = React.ForwardRefExoticComponent<
  AppCheckboxProps & React.RefAttributes<AppCheckboxRef>
> & {
  Group: React.FC<CheckboxGroupProps>;
};

const InternalAppCheckbox = React.forwardRef<AppCheckboxRef, AppCheckboxProps>(
  ({ className, ...rest }, ref) => {
    return <Checkbox ref={ref} {...rest} className={className} />;
  }
);

const AppCheckbox = InternalAppCheckbox as CompoundedComponent;

AppCheckbox.displayName = 'AppCheckbox';
AppCheckbox.Group = Checkbox.Group;

export default AppCheckbox;
