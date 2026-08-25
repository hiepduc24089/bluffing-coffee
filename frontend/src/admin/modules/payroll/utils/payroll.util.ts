export function formatCurrency(value?: number | null): string {
  if (value === null || value === undefined) return '—';

  return `${value.toLocaleString('vi-VN')}đ`;
}

/** 7.5 giờ đọc là "7h30" — dễ đối chiếu với bảng công viết tay hơn số thập phân. */
export function formatHours(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  return minutes === 0 ? `${wholeHours}h` : `${wholeHours}h${String(minutes).padStart(2, '0')}`;
}
