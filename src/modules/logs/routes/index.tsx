'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { Download, RefreshCcw, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { ProtectedPage } from '@/core/components/common/ProtectedPage';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { LoadingSpinner } from '@/core/components/common/LoadingSpinner';
import { usePermissions } from '@/core/hooks/usePermissions';
import { useDebounce } from '@/core/hooks/useDebounce';
import type { LogRecord, LogListFilters, LogStats, LogListResponse } from '../types';
import { LogsStatsCards } from '../components/LogsStatsCards';
import { LogsTable } from '../components/LogsTable';
import { LogsFilters } from '../components/LogsFilters';
import { LogDetailDialog } from '../components/LogDetailDialog';

const defaultFilters: LogListFilters = {
  page: 1,
  limit: 50,
};

export default function LogsPage() {
  const [logs, setLogs] = useState<LogRecord[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [filters, setFilters] = useState<LogListFilters>(defaultFilters);
  const [selectedLog, setSelectedLog] = useState<LogRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  const { hasPermission } = usePermissions();
  const debouncedSearch = useDebounce(filters.search, 300);

  const canRead = hasPermission('logs:read') || hasPermission('logs:*');
  const canExport = hasPermission('logs:export') || hasPermission('logs:*');

  const fetchLogs = useCallback(async () => {
    if (!canRead) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (filters.module) params.set('module', filters.module);
      if (filters.level) params.set('level', filters.level);
      if (filters.action) params.set('action', filters.action);
      if (filters.userId) params.set('userId', filters.userId);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (filters.page) params.set('page', filters.page.toString());
      if (filters.limit) params.set('limit', filters.limit.toString());

      const query = params.toString();
      const url = query ? `/api/logs?${query}` : '/api/logs';

      const res = await fetch(url);
      const json = await res.json();

      if (res.ok && json.success) {
        const data: LogListResponse = json.data;
        setLogs(data.logs);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      } else {
        toast.error(json.error || 'Failed to load logs');
      }
    } catch (error) {
      console.error('Logs fetch error:', error);
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, [canRead, debouncedSearch, filters]);

  const fetchStats = useCallback(async () => {
    if (!canRead) return;

    setStatsLoading(true);
    try {
      const res = await fetch('/api/logs/stats?days=7');
      const json = await res.json();

      if (res.ok && json.success) {
        setStats(json.data);
      }
    } catch (error) {
      console.error('Stats fetch error:', error);
    } finally {
      setStatsLoading(false);
    }
  }, [canRead]);

  const handleExport = async () => {
    if (!canExport) {
      toast.error('You do not have permission to export logs');
      return;
    }

    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.module) params.set('module', filters.module);
      if (filters.level) params.set('level', filters.level);
      if (filters.action) params.set('action', filters.action);
      if (filters.userId) params.set('userId', filters.userId);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);

      const query = params.toString();
      const url = query ? `/api/logs/export?${query}` : '/api/logs/export';

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Export failed');
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `logs-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('Logs exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export logs');
    }
  };

  const setupRealTimeStream = useCallback(() => {
    if (!isRealTimeEnabled || !canRead) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Build query params for stream
    const params = new URLSearchParams();
    if (filters.module) params.set('module', filters.module);
    if (filters.level) params.set('level', filters.level);

    const query = params.toString();
    const streamUrl = query ? `/api/logs/stream?${query}` : '/api/logs/stream';

    const eventSource = new EventSource(streamUrl, {
      withCredentials: true,
    });

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_logs' || data.type === 'new_log') {
          // Refresh logs when new ones arrive
          fetchLogs();
          fetchStats();
        } else if (data.type === 'initial') {
          // Initial data received
          if (data.logs && data.logs.length > 0) {
            // Optionally update logs with initial data
          }
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      // EventSource will automatically reconnect
    };

    eventSourceRef.current = eventSource;
  }, [isRealTimeEnabled, canRead, filters.module, filters.level, fetchLogs, fetchStats]);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [fetchLogs, fetchStats]);

  useEffect(() => {
    if (isRealTimeEnabled) {
      setupRealTimeStream();
    } else {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [isRealTimeEnabled, setupRealTimeStream]);

  const handleFilterChange = (newFilters: LogListFilters) => {
    setFilters({ ...newFilters, page: 1 }); // Reset to page 1 when filters change
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
  };

  const handleLogClick = (log: LogRecord) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  if (!canRead) {
    return (
      <ProtectedPage
        permission="logs:read"
        title="System Logs"
        description="View and monitor system logs from all modules"
      >
        <></>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage
      permission="logs:read"
      title="System Logs"
      description="View and monitor system logs from all modules"
    >
      <div className="w-full px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <LogsStatsCards stats={stats || {
          total: 0,
          byLevel: { info: 0, warning: 0, error: 0, debug: 0, success: 0 },
          byModule: {},
          errorsLast24h: 0,
          errorsLast7d: 0,
          avgResponseTime: null,
        }} loading={statsLoading} />

        {/* Main Content */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-2xl font-bold">Logs</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={isRealTimeEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
                title={isRealTimeEnabled ? 'Disable real-time updates' : 'Enable real-time updates'}
              >
                {isRealTimeEnabled ? (
                  <Wifi className="h-4 w-4 mr-2" />
                ) : (
                  <WifiOff className="h-4 w-4 mr-2" />
                )}
                {isRealTimeEnabled ? 'Real-time ON' : 'Real-time OFF'}
              </Button>
              {canExport && (
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => { fetchLogs(); fetchStats(); }}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <LogsFilters
              filters={filters}
              onFiltersChange={handleFilterChange}
              onReset={handleResetFilters}
            />

            {/* Logs Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : (
              <>
                <LogsTable logs={logs} onLogClick={handleLogClick} />
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {((filters.page || 1) - 1) * (filters.limit || 50) + 1} to{' '}
                      {Math.min((filters.page || 1) * (filters.limit || 50), total)} of {total} logs
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange((filters.page || 1) - 1)}
                        disabled={(filters.page || 1) <= 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange((filters.page || 1) + 1)}
                        disabled={(filters.page || 1) >= totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Log Detail Dialog */}
        <LogDetailDialog
          log={selectedLog}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
        />
      </div>
    </ProtectedPage>
  );
}

