import React from 'react';
import { InputNumber } from 'antd';
import type { InputNumberProps } from 'antd';

export type AppInputNumberProps = InputNumberProps & {
  /**
   * When `max` is an integer and `precision` is 0/undefined, block typing more digits
   * than the maximum supports (prevents the "cut on blur" behavior).
   *
   * Default: true
   */
  blockExceedMaxInput?: boolean;
  blockNonNumericInput?: boolean;
  cursorAtEndOnFocus?: boolean;
  replaceZeroOnDigit?: boolean;
};

const AppInputNumber = React.forwardRef<any, AppInputNumberProps>((props, ref) => {
  const {
    blockExceedMaxInput = true,
    blockNonNumericInput = true,
    cursorAtEndOnFocus = true,
    replaceZeroOnDigit = true,
    onKeyDown,
    onPaste,
    onFocus,
    maxLength,
    max,
    min,
    precision,
    ...rest
  } = props;

  const containerRef = React.useRef<HTMLSpanElement>(null);

  const shouldBlockByDigits =
    blockExceedMaxInput &&
    typeof max === 'number' &&
    Number.isFinite(max) &&
    Number.isInteger(max) &&
    max >= 0 &&
    (precision === undefined || precision === null || precision === 0) &&
    (min === undefined || min === null || (typeof min === 'number' && min >= 0));

  const maxDigits = shouldBlockByDigits ? String(max).length : undefined;

  const allowNegative = min === undefined || min === null || (typeof min === 'number' && min < 0);
  const allowDecimal =
    precision === undefined ||
    precision === null ||
    (typeof precision === 'number' && precision > 0);

  const sanitizeNumeric = (text: string): string => {
    let pattern: RegExp;
    if (allowNegative && allowDecimal) pattern = /[^\d.-]/g;
    else if (allowNegative) pattern = /[^\d-]/g;
    else if (allowDecimal) pattern = /[^\d.]/g;
    else pattern = /[^\d]/g;
    return text.replace(pattern, '');
  };

  // Block non-numeric input via TWO native DOM listeners (bypasses React synthetic-event
  // quirks and antd's ref Proxy):
  //   1. `beforeinput` + preventDefault → blocks insertion before it happens (desktop, most cases).
  //   2. `input` fallback → if a char still slipped through (IME composition, Vietnamese
  //      Telex, fast paste), immediately rewrite the input value to the sanitized version
  //      via the native value setter and re-dispatch `input` so React/antd resync.
  // The container <span display: contents> wraps the InputNumber so we can reliably
  // query the real <input> regardless of antd's ref-forwarding internals.
  React.useLayoutEffect(() => {
    if (!blockNonNumericInput) return;
    const el = containerRef.current?.querySelector('input');
    if (!el) return;

    const buildPattern = () => {
      if (allowNegative && allowDecimal) return /[^\d.-]/g;
      if (allowNegative) return /[^\d-]/g;
      if (allowDecimal) return /[^\d.]/g;
      return /[^\d]/g;
    };

    const beforeInputHandler = (e: Event) => {
      const ev = e as InputEvent;
      const data = ev.data;
      if (data == null) return;
      const pattern = buildPattern();
      if (pattern.test(data)) {
        e.preventDefault();
      }
    };

    const nativeValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set;

    let syncing = false;
    const inputHandler = (e: Event) => {
      if (syncing) return;
      const target = e.target as HTMLInputElement | null;
      if (!target) return;
      const raw = target.value ?? '';
      const cleaned = raw.replace(buildPattern(), '');
      if (cleaned === raw) return;
      // Replace the displayed value synchronously and re-fire `input` so antd's
      // controlled-value state stays in sync with the sanitized text.
      syncing = true;
      nativeValueSetter?.call(target, cleaned);
      target.dispatchEvent(new Event('input', { bubbles: true }));
      syncing = false;
    };

    el.addEventListener('beforeinput', beforeInputHandler);
    el.addEventListener('input', inputHandler);
    return () => {
      el.removeEventListener('beforeinput', beforeInputHandler);
      el.removeEventListener('input', inputHandler);
    };
  }, [blockNonNumericInput, allowNegative, allowDecimal]);

  return (
    <span ref={containerRef} style={{ display: 'contents' }}>
      <InputNumber
        ref={ref}
        maxLength={maxDigits ?? maxLength}
        onKeyDown={e => {
          onKeyDown?.(e);
          if (e.defaultPrevented) return;

          if (e.ctrlKey || e.metaKey || e.altKey) return;
          if (e.key.length > 1) return;
          if ((e.nativeEvent as KeyboardEvent)?.isComposing) return;

          const input = e.currentTarget as unknown as HTMLInputElement;
          const value = input.value ?? '';
          const selStart = input.selectionStart ?? value.length;
          const selEnd = input.selectionEnd ?? value.length;
          const isDigit = /^\d$/.test(e.key);

          if (blockNonNumericInput) {
            const isMinus =
              e.key === '-' && allowNegative && selStart === 0 && !value.includes('-');
            const isDot = e.key === '.' && allowDecimal && !value.includes('.');
            if (!isDigit && !isMinus && !isDot) {
              e.preventDefault();
              return;
            }
          }

          if (shouldBlockByDigits && maxDigits && isDigit) {
            const digitsOnly = value.replace(/[^\d]/g, '');
            const selectedCount = Math.max(0, selEnd - selStart);
            if (digitsOnly.length - selectedCount >= maxDigits) {
              e.preventDefault();
            }
          }

          // Replace lone "0" with the typed digit so "0" + "7" becomes "7" (not "07").
          if (replaceZeroOnDigit && isDigit && value === '0' && !e.defaultPrevented) {
            e.preventDefault();
            const setter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype,
              'value'
            )?.set;
            setter?.call(input, e.key);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            requestAnimationFrame(() => {
              const len = input.value?.length ?? 0;
              try {
                input.setSelectionRange(len, len);
              } catch {
                // ignore
              }
            });
          }
        }}
        onFocus={e => {
          onFocus?.(e);
          if (e.defaultPrevented) return;
          if (!cursorAtEndOnFocus) return;
          const target = e.target as HTMLInputElement;
          // Run after antd's internal focus/click caret placement.
          requestAnimationFrame(() => {
            const len = target.value?.length ?? 0;
            try {
              target.setSelectionRange(len, len);
            } catch {
              // setSelectionRange may throw on unsupported input types — safe to ignore.
            }
          });
        }}
        onPaste={e => {
          onPaste?.(e);
          if (e.defaultPrevented) return;
          if (!blockNonNumericInput) return;
          const text = e.clipboardData?.getData('text') ?? '';
          if (!text) return;
          const cleaned = sanitizeNumeric(text);
          if (cleaned === text) return;
          e.preventDefault();
          if (!cleaned) return;
          const input = e.currentTarget as unknown as HTMLInputElement;
          const start = input.selectionStart ?? input.value.length;
          const end = input.selectionEnd ?? input.value.length;
          const next = input.value.slice(0, start) + cleaned + input.value.slice(end);
          const setter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
          )?.set;
          setter?.call(input, next);
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }}
        max={max}
        min={min}
        precision={precision}
        {...rest}
      />
    </span>
  );
});

AppInputNumber.displayName = 'AppInputNumber';

export default AppInputNumber;
