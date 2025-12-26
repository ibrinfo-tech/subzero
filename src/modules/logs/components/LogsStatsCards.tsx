'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { AlertCircle, CheckCircle, Info, AlertTriangle, Bug, Activity } from 'lucide-react';
import type { LogStats } from '../types';

interface LogsStatsCardsProps {
  stats: LogStats;
  loading?: boolean;
}

export function LogsStatsCards({ stats, loading }: LogsStatsCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Logs',
      value: stats.total.toLocaleString(),
      icon: Activity,
      color: 'text-blue-600',
    },
    {
      title: 'Info',
      value: stats.byLevel.info.toLocaleString(),
      icon: Info,
      color: 'text-blue-600',
    },
    {
      title: 'Success',
      value: stats.byLevel.success.toLocaleString(),
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      title: 'Warnings',
      value: stats.byLevel.warning.toLocaleString(),
      icon: AlertTriangle,
      color: 'text-yellow-600',
    },
    {
      title: 'Errors (24h)',
      value: stats.errorsLast24h.toLocaleString(),
      icon: AlertCircle,
      color: 'text-red-600',
    },
    {
      title: 'Errors (7d)',
      value: stats.errorsLast7d.toLocaleString(),
      icon: AlertCircle,
      color: 'text-red-600',
    },
    {
      title: 'Debug',
      value: stats.byLevel.debug.toLocaleString(),
      icon: Bug,
      color: 'text-gray-600',
    },
    {
      title: 'Avg Response Time',
      value: stats.avgResponseTime ? `${stats.avgResponseTime}ms` : 'N/A',
      icon: Activity,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

