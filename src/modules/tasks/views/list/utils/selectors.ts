import { TaskRecord, TaskSection } from '../../../types';

export function mapTasksToSections(
  sections: TaskSection[],
  tasks: TaskRecord[]
) {
  // Filter out tasks without sectionId (for backward compatibility during migration)
  const validTasks = tasks.filter(t => t.sectionId);
  
  return sections
    .sort((a, b) => a.order - b.order)
    .map(section => ({
      ...section,
      tasks: validTasks.filter(t => t.sectionId === section.id),
    }));
}
