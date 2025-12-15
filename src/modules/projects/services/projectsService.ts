import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '@/core/lib/db';
import { projects } from '../schemas/projectsSchema';
import type { NewProject, Project } from '../schemas/projectsSchema';
import type { CreateProjectInput, UpdateProjectInput } from '../schemas/projectsValidation';

const toNumeric = (value?: number | null): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  return value.toString();
};

const toDate = (value?: string): Date | null | undefined => {
  if (value === undefined) {
    return undefined;
  }
  if (!value || value.trim() === '') {
    return null;
  }
  const parsed = new Date(value);
  // Guard against invalid dates
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

// Convert Date to ISO string for date fields (YYYY-MM-DD format)
const toDateString = (value?: string): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }
  if (!value || value.trim() === '') {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  // Return date in YYYY-MM-DD format for PostgreSQL date type
  return parsed.toISOString().split('T')[0];
};

export async function listProjectsForTenant(tenantId: string): Promise<Project[]> {
  return db
    .select()
    .from(projects)
    .where(and(eq(projects.tenantId, tenantId), isNull(projects.deletedAt)))
    .orderBy(desc(projects.createdAt));
}

export async function getProjectById(projectId: string, tenantId: string): Promise<Project | null> {
  const result = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.tenantId, tenantId), isNull(projects.deletedAt)))
    .limit(1);

  return result[0] ?? null;
}

export async function createProject(params: {
  data: CreateProjectInput;
  tenantId: string;
  userId: string;
}): Promise<Project> {
  const { data, tenantId, userId } = params;

  const payload: NewProject = {
    tenantId,
    projectCode: data.projectCode ?? null,
    title: data.title,
    description: data.description ?? null,
    projectType: data.projectType ?? null,
    status: data.status ?? 'open',
    priority: data.priority ?? 'medium',
    startDate: toDateString(data.startDate) ?? null,
    deadline: toDateString(data.deadline) ?? null,
    completedAt: toDate(data.completedAt) ?? null,
    estimatedHours: toNumeric(Number(data.estimatedHours ?? 0)),
    actualHours: toNumeric(Number(data.actualHours ?? 0)) ?? '0',
    budgetAmount: toNumeric(data.budgetAmount as number | null),
    spentAmount: toNumeric(Number(data.spentAmount ?? 0)) ?? '0',
    price: toNumeric(data.price as number | null),
    currency: data.currency ?? 'USD',
    progressPercentage: data.progressPercentage ?? 0,
    billingType: data.billingType ?? 'fixed',
    isBillable: data.isBillable ?? true,
    isTemplate: data.isTemplate ?? false,
    labelIds: data.labelIds ?? [],
    customFields: data.customFields ?? {},
    settings: data.settings ?? {},
    notes: data.notes ?? null,
    createdBy: userId,
    updatedBy: userId,
  };

  const result = await db.insert(projects).values(payload).returning();
  return result[0];
}

export async function updateProject(params: {
  projectId: string;
  tenantId: string;
  userId: string;
  data: UpdateProjectInput;
}): Promise<Project | null> {
  const { projectId, tenantId, userId, data } = params;

  const existing = await getProjectById(projectId, tenantId);
  if (!existing) {
    return null;
  }

  const updates: Partial<NewProject> = {
    projectCode: data.projectCode ?? undefined,
    title: data.title ?? undefined,
    description: data.description ?? undefined,
    projectType: data.projectType ?? undefined,
    status: data.status ?? undefined,
    priority: data.priority ?? undefined,
    startDate: toDateString(data.startDate),
    deadline: toDateString(data.deadline),
    completedAt: toDate(data.completedAt),
    estimatedHours: data.estimatedHours !== undefined ? toNumeric(Number(data.estimatedHours)) : undefined,
    actualHours: data.actualHours !== undefined ? toNumeric(Number(data.actualHours)) : undefined,
    budgetAmount: data.budgetAmount !== undefined ? toNumeric(Number(data.budgetAmount)) : undefined,
    spentAmount: data.spentAmount !== undefined ? toNumeric(Number(data.spentAmount)) : undefined,
    price: data.price !== undefined ? toNumeric(Number(data.price)) : undefined,
    currency: data.currency ?? undefined,
    progressPercentage: data.progressPercentage ?? undefined,
    billingType: data.billingType ?? undefined,
    isBillable: data.isBillable ?? undefined,
    isTemplate: data.isTemplate ?? undefined,
    labelIds: data.labelIds ?? undefined,
    customFields: data.customFields ?? undefined,
    settings: data.settings ?? undefined,
    notes: data.notes ?? undefined,
    updatedBy: userId,
    updatedAt: new Date(),
  };

  const result = await db
    .update(projects)
    .set(updates)
    .where(and(eq(projects.id, projectId), eq(projects.tenantId, tenantId)))
    .returning();

  return result[0] ?? null;
}

export async function deleteProject(projectId: string, tenantId: string, userId: string): Promise<boolean> {
  const existing = await getProjectById(projectId, tenantId);
  if (!existing) {
    return false;
  }

  await db
    .update(projects)
    .set({ deletedAt: new Date(), updatedBy: userId, updatedAt: new Date() })
    .where(and(eq(projects.id, projectId), eq(projects.tenantId, tenantId)));

  return true;
}


