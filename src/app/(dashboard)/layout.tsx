import { DashboardLayout } from '@/core/components/layout/DashboardLayout';
import { EventBootstrap } from './components/EventBootstrap';

export default async function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  // Bootstrap event handlers on server-side
  await EventBootstrap();

  return <DashboardLayout>{children}</DashboardLayout>;
}
