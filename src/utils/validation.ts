import { z } from 'zod';

export const cryptoPriceQuerySchema = z.object({
  ids: z.string().refine((val) => val.length > 0, 'At least one coin ID is required'),
  vs_currencies: z.string().optional().default('usd'),
});

export const marketChartQuerySchema = z.object({
  vs_currency: z.string().optional().default('usd'),
  days: z
    .string()
    .optional()
    .default('7')
    .refine((val) => {
      const num = parseInt(val);
      return !isNaN(num) && num > 0 && num <= 365;
    }, 'Days must be between 1 and 365'),
});

export const forexRateQuerySchema = z.object({
  from: z.string().min(3).max(3).optional(),
  to: z.string().min(3).max(3).optional(),
  date: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      return !isNaN(Date.parse(val));
    }, 'Invalid date format'),
});

export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .refine((val) => {
      const num = parseInt(val);
      return !isNaN(num) && num > 0;
    }, 'Page must be a positive integer'),
  limit: z
    .string()
    .optional()
    .default('50')
    .refine((val) => {
      const num = parseInt(val);
      return !isNaN(num) && num > 0 && num <= 100;
    }, 'Limit must be between 1 and 100'),
});

export type CryptoPriceQuery = z.infer<typeof cryptoPriceQuerySchema>;
export type MarketChartQuery = z.infer<typeof marketChartQuerySchema>;
export type ForexRateQuery = z.infer<typeof forexRateQuerySchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
