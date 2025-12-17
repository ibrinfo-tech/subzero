import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '@/core/lib/db';
import { tasks } from '../schemas/tasksSchema';
import type { NewTask, Task } from '../schemas/tasksSchema';
import type { CreateTaskInput, UpdateTaskInput } from '../schemas/tasksValidation';

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
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export async function listTasksForTenant(tenantId: string): Promise<Task[]> {
  return db
    .select()
    .from(tasks)
    .where(and(eq(tasks.tenantId, tenantId), isNull(tasks.deletedAt)))
    .orderBy(desc(tasks.createdAt));
}

export async function getTaskById(taskId: string, tenantId: string): Promise<Task | null> {
  const result = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.tenantId, tenantId), isNull(tasks.deletedAt)))
    .limit(1);

  return result[0] ?? null;
}

export async function createTask(params: {
  data: CreateTaskInput;
  tenantId: string;
  userId: string;
}): Promise<Task> {
  const { data, tenantId, userId } = params;

  const payload: NewTask = {
    tenantId,
    taskCode: data.taskCode ?? null,
    title: data.title,
    description: data.description ?? null,
    projectId: data.projectId ?? null,
    milestoneId: data.milestoneId ?? null,
    parentTaskId: data.parentTaskId ?? null,
    assignedTo: data.assignedTo ?? null,
    status: data.status ?? 'to_do',
    priority: data.priority ?? 'medium',
    points: data.points ?? null,
    startDate: data.startDate ?? null,
    deadline: data.deadline ?? null,
    completedAt: data.completedAt ? new Date(data.completedAt) : null,
    estimatedHours: toNumeric(Number(data.estimatedHours ?? 0)),
    actualHours: toNumeric(Number(data.actualHours ?? 0)) ?? '0',
    isRecurring: data.isRecurring ?? false,
    recurringConfig: data.recurringConfig ?? null,
    isBillable: data.isBillable ?? true,
    labelIds: data.labelIds ?? [],
    customFields: data.customFields ?? {},
    sortOrder: data.sortOrder ?? 0,
    createdBy: userId,
    updatedBy: userId,
  };

  const result = await db.insert(tasks).values(payload).returning();
  return result[0];
}

export async function updateTask(params: {
  taskId: string;
  tenantId: string;
  userId: string;
  data: UpdateTaskInput;
}): Promise<Task | null> {
  const { taskId, tenantId, userId, data } = params;

  const existing = await getTaskById(taskId, tenantId);
  if (!existing) {
    return null;
  }

  const updates: Partial<NewTask> = {
    taskCode: data.taskCode ?? undefined,
    title: data.title ?? undefined,
    description: data.description ?? undefined,
    projectId: data.projectId ?? undefined,
    milestoneId: data.milestoneId ?? undefined,
    parentTaskId: data.parentTaskId ?? undefined,
    assignedTo: data.assignedTo ?? undefined,
    status: data.status ?? undefined,
    priority: data.priority ?? undefined,
    points: data.points ?? undefined,
    startDate: data.startDate ?? undefined,
    deadline: data.deadline ?? undefined,
    completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
    estimatedHours: data.estimatedHours !== undefined ? toNumeric(Number(data.estimatedHours)) : undefined,
    actualHours: data.actualHours !== undefined ? toNumeric(Number(data.actualHours)) : undefined,
    isRecurring: data.isRecurring ?? undefined,
    recurringConfig: data.recurringConfig ?? undefined,
    isBillable: data.isBillable ?? undefined,
    labelIds: data.labelIds ?? undefined,
    customFields: data.customFields ?? undefined,
    sortOrder: data.sortOrder ?? undefined,
    updatedBy: userId,
    updatedAt: new Date(),
  };

  const result = await db
    .update(tasks)
    .set(updates)
    .where(and(eq(tasks.id, taskId), eq(tasks.tenantId, tenantId)))
    .returning();

  return result[0] ?? null;
}

export async function deleteTask(taskId: string, tenantId: string, userId?: string): Promise<boolean> {
  const existing = await getTaskById(taskId, tenantId);
  if (!existing) {
    return false;
  }

  await db
    .update(tasks)
    .set({ deletedAt: new Date(), updatedBy: userId ?? existing.updatedBy, updatedAt: new Date() })
    .where(and(eq(tasks.id, taskId), eq(tasks.tenantId, tenantId)));

  return true;
}


