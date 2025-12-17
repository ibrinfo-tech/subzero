import type {
  Project,
  NewProject,
  ProjectMember,
  NewProjectMember,
  ProjectMilestone,
  NewProjectMilestone,
} from '../schemas/projectsSchema';
import type { CreateProjectInput, UpdateProjectInput } from '../schemas/projectsValidation';

export type {
  Project,
  NewProject,
  ProjectMember,
  NewProjectMember,
  ProjectMilestone,
  NewProjectMilestone,
  CreateProjectInput,
  UpdateProjectInput,
};

export interface ProjectWithRelations extends Project {
  members?: ProjectMember[];
  milestones?: ProjectMilestone[];
}


