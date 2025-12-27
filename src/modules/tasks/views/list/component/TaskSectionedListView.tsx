'use client';

import { Plus } from 'lucide-react';
import { cn } from '@/core/lib/utils';
import { TaskRow } from './TaskRow';
import { InlineAddTaskRow } from './InlineAddTaskRow';
import { InlineEditTaskRow } from './InlineEditTaskRow';
import { SectionHeader } from './SectionHeader';
import { TaskRecord, TaskSection } from '../../../types';

interface Props {
  sections: (TaskSection & { tasks: TaskRecord[] })[];
  expandedSections: Set<string>;
  creatingTaskInSectionId?: string | null;
  editingTaskId?: string | null;
  onToggleSection: (sectionId: string) => void;
  onEditSectionTitle: (sectionId: string, newTitle: string) => void;
  onAddTask?: (sectionId: string) => void;
  onCreateTask?: (sectionId: string, title: string) => void;
  onCancelAddTask?: () => void;
  onEdit?: (task: TaskRecord) => void;
  onSaveTask?: (task: TaskRecord) => void;
  onCancelEditTask?: () => void;
  onToggleComplete?: (task: TaskRecord) => void;
}

export function TaskSectionedListView({
  sections,
  expandedSections,
  creatingTaskInSectionId,
  editingTaskId,
  onToggleSection,
  onEditSectionTitle,
  onAddTask,
  onCreateTask,
  onCancelAddTask,
  onEdit,
  onSaveTask,
  onCancelEditTask,
  onToggleComplete,
}: Props) {
  return (
    <div className="bg-card border-t overflow-hidden">
      {/* TABLE HEADER */}
      <div className="grid grid-cols-[40px_1fr_120px_120px_120px_40px] px-4 py-2 text-sm font-medium text-muted-foreground border-b mb-6">
        <div />
        <div>Name</div>
        <div className="text-left">Assignee</div>
        <div className="text-left">Due date</div>
        <div className="text-left">Status</div>
        <div />
      </div>

      {/* SECTIONS - No borders, seamless flow */}
      {sections.map((section, sectionIndex) => {
        const isExpanded = expandedSections.has(section.id);
        const isLastSection = sectionIndex === sections.length - 1;
        
        return (
          <div key={section.id} className={cn(!isLastSection && 'mb-6')}>
            {/* SECTION HEADER - Same grid as tasks */}
            <SectionHeader
              sectionId={section.id}
              title={section.title}
              isExpanded={isExpanded}
              onToggleExpand={() => onToggleSection(section.id)}
              onEditTitle={(newTitle) => onEditSectionTitle(section.id, newTitle)}
              onAddTask={() => onAddTask?.(section.id)}
            />

            {/* TASKS - Only show if expanded, no extra borders */}
            {isExpanded && (
              <>
                {section.tasks.map((task, taskIndex) => {
                  const isLastTask = taskIndex === section.tasks.length - 1;
                  const showAddRow = creatingTaskInSectionId === section.id;
                  
                  if (editingTaskId === task.id) {
                    // Show inline edit row
                    return (
                      <InlineEditTaskRow
                        key={task.id}
                        task={task}
                        onSave={(updatedTask) => onSaveTask?.(updatedTask)}
                        onCancel={() => onCancelEditTask?.()}
                        onToggleComplete={onToggleComplete}
                      />
                    );
                  }
                  return (
                    <div key={task.id} className={cn(!isLastTask && !showAddRow && 'border-b border-border/30')}>
                      <TaskRow
                        task={task}
                        onEdit={onEdit}
                        onToggleComplete={onToggleComplete}
                      />
                    </div>
                  );
                })}

                {/* INLINE ADD TASK ROW OR ADD TASK TRIGGER */}
                {creatingTaskInSectionId === section.id ? (
                  <InlineAddTaskRow
                    sectionId={section.id}
                    onSubmit={(title) => onCreateTask?.(section.id, title)}
                    onCancel={() => onCancelAddTask?.()}
                  />
                ) : (
                  <div
                    className={cn(
                      'grid grid-cols-[40px_1fr_120px_120px_120px_40px]',
                      'px-4 py-2 text-muted-foreground hover:bg-accent/40 cursor-pointer'
                    )}
                    onClick={() => onAddTask?.(section.id)}
                  >
                    <div />
                    <div className="flex items-center gap-2 text-sm">
                      <Plus className="h-4 w-4" />
                      Add task…
                    </div>
                    <div />
                    <div />
                    <div />
                    <div />
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
