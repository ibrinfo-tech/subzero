import KanbanBoard from './components/KanbanBoard';
import type { TaskListFilters } from '../../types';

interface KanbanViewProps {
  filters?: TaskListFilters;
}

export default function KanbanView({ filters }: KanbanViewProps) {
  return <KanbanBoard filters={filters} />;
}
