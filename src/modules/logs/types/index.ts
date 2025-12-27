import type { SystemLog } from '@/core/lib/db/baseSchema';

export type LogRecord = SystemLog & {
  user?: {
    id: string;
    email: string;
    fullName: string | null;
  };
};

export interface LogListFilters {
  search?: string;
  module?: string;
  level?: string;
  action?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface LogStats {
  total: number;
  byLevel: {
    info: number;
    warning: number;
    error: number;
    debug: number;
    success: number;
  };
  byModule: Record<string, number>;
  errorsLast24h: number;
  errorsLast7d: number;
  avgResponseTime: number | null;
}

export interface LogListResponse {
  logs: LogRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

