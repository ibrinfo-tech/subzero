import type { Task } from '../types';
import type { SortState } from '../types';

/**
 * Sort tasks by the specified field and direction
 * @param tasks - Array of tasks to sort
 * @param sortState - Sort state ('dueDate_asc', 'dueDate_desc', 'title_asc', 'title_desc', or null)
 * @returns Sorted array of tasks
 */
export function sortTasks(tasks: Task[], sortState: SortState): Task[] {
  if (!sortState) return tasks;

  const [field, direction] = sortState.split('_') as ['dueDate' | 'title', 'asc' | 'desc'];

  return [...tasks].sort((a, b) => {
    if (field === 'dueDate') {
      // Sort by due date
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      
      // Tasks without due dates go to the end
      const comparison = dateA - dateB;
      return direction === 'asc' ? comparison : -comparison;
    } else {
      // Sort by title (case-insensitive)
      const titleA = a.title.toLowerCase();
      const titleB = b.title.toLowerCase();
      const comparison = titleA.localeCompare(titleB);
      
      return direction === 'asc' ? comparison : -comparison;
    }
  });
}

/**
 * Get next sort state when toggling
 * Cycle: null -> 'dueDate_asc' -> 'dueDate_desc' -> 'title_asc' -> 'title_desc' -> null
 */
export function getNextSortState(current: SortState): SortState {
  if (current === null) return 'dueDate_asc';
  if (current === 'dueDate_asc') return 'dueDate_desc';
  if (current === 'dueDate_desc') return 'title_asc';
  if (current === 'title_asc') return 'title_desc';
  return null;
}

