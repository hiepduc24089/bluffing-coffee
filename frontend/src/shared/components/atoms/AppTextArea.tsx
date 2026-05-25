import { Input } from 'antd';
import type { TextAreaProps } from 'antd/es/input';
import type { TextAreaRef } from 'antd/es/input/TextArea';
import { forwardRef } from 'react';

const { TextArea } = Input;

export type AppTextAreaProps = Omit<TextAreaProps, 'ref'>;

/**
 * AppTextArea is a wrapper around Ant Design's Input.TextArea component.
 *
 * @component
 * @example
 * <AppTextArea rows={4} />
 */
const AppTextArea = forwardRef<TextAreaRef, AppTextAreaProps>((props, ref) => {
  return <TextArea ref={ref} {...props} />;
});

AppTextArea.displayName = 'AppTextArea';

export default AppTextArea;
