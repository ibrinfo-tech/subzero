import type {
  Task,
  NewTask,
  TaskCollaborator,
  NewTaskCollaborator,
  TaskChecklistItem,
  NewTaskChecklistItem,
} from '../schemas/tasksSchema';
import type { CreateTaskInput, UpdateTaskInput } from '../schemas/tasksValidation';

export type {
  Task,
  NewTask,
  TaskCollaborator,
  NewTaskCollaborator,
  TaskChecklistItem,
  NewTaskChecklistItem,
  CreateTaskInput,
  UpdateTaskInput,
};

export interface TaskWithRelations extends Task {
  collaborators?: TaskCollaborator[];
  checklist?: TaskChecklistItem[];
}


