import type { KanbanColumn } from './types';

export const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: "todo",
    title: "Todo",
  },
  {
    id: "in_progress",
    title: "In Progress",
  },
  {
    id: "completed",
    title: "Completed",
  },
  {
    id: "hold",
    title: "Hold",
  },
  {
    id: "next_sprint",
    title: "Next Sprint",
  },
];

