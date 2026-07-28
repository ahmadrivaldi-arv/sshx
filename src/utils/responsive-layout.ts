export type ResponsiveLayout = 'wide' | 'medium' | 'narrow';

export const getResponsiveLayout = (columns: number, rows: number): ResponsiveLayout => {
  if (columns >= 110 && rows >= 26) return 'wide';
  if (columns >= 76 && rows >= 20) return 'medium';
  return 'narrow';
};
