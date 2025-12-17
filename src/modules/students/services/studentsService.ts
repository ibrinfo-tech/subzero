import { and, desc, eq, ilike, isNull } from 'drizzle-orm';
import { db } from '@/core/lib/db';
import { students } from '../schemas/studentsSchema';
import type { NewStudent, Student } from '../schemas/studentsSchema';
import type { CreateStudentInput, UpdateStudentInput } from '../schemas/studentsValidation';

export interface StudentListFilters {
  search?: string;
  status?: string;
  course?: string;
  semester?: string;
}

export async function listStudentsForTenant(
  tenantId: string,
  filters: StudentListFilters = {},
): Promise<Student[]> {
  const conditions = [
    eq(students.tenantId, tenantId),
    isNull(students.deletedAt),
  ];

  if (filters.status && filters.status !== 'all') {
    conditions.push(eq(students.status, filters.status));
  }

  if (filters.course && filters.course !== 'all') {
    conditions.push(eq(students.course, filters.course));
  }

  if (filters.semester && filters.semester !== 'all') {
    conditions.push(eq(students.semester, filters.semester));
  }

  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push(ilike(students.fullName, searchTerm));
  }

  return db
    .select()
    .from(students)
    .where(and(...conditions))
    .orderBy(desc(students.createdAt));
}

export async function getStudentById(
  studentId: string,
  tenantId: string,
): Promise<Student | null> {
  const result = await db
    .select()
    .from(students)
    .where(
      and(
        eq(students.id, studentId),
        eq(students.tenantId, tenantId),
        isNull(students.deletedAt),
      ),
    )
    .limit(1);

  return result[0] ?? null;
}

export async function createStudent(params: {
  data: CreateStudentInput;
  tenantId: string;
  userId: string;
}): Promise<Student> {
  const { data, tenantId, userId } = params;

  const payload: NewStudent = {
    tenantId,
    rollNumber: data.rollNumber,
    fullName: data.fullName,
    email: data.email ?? null,
    phone: data.phone ?? null,
    course: data.course ?? null,
    semester: data.semester ?? null,
    admissionDate: data.admissionDate ?? null,
    status: data.status ?? 'active',
    labelIds: data.labelIds ?? [],
    customFields: data.customFields ?? {},
    createdBy: userId,
    updatedBy: userId,
  };

  const result = await db.insert(students).values(payload).returning();
  return result[0];
}

export async function updateStudent(params: {
  studentId: string;
  tenantId: string;
  userId: string;
  data: UpdateStudentInput;
}): Promise<Student | null> {
  const { studentId, tenantId, userId, data } = params;

  const existing = await getStudentById(studentId, tenantId);
  if (!existing) {
    return null;
  }

  const updates: Partial<NewStudent> = {
    rollNumber: data.rollNumber ?? undefined,
    fullName: data.fullName ?? undefined,
    email: data.email ?? undefined,
    phone: data.phone ?? undefined,
    course: data.course ?? undefined,
    semester: data.semester ?? undefined,
    admissionDate: data.admissionDate ?? undefined,
    status: data.status ?? undefined,
    labelIds: data.labelIds ?? undefined,
    customFields: data.customFields ?? undefined,
    updatedBy: userId,
    updatedAt: new Date(),
  };

  const result = await db
    .update(students)
    .set(updates)
    .where(and(eq(students.id, studentId), eq(students.tenantId, tenantId)))
    .returning();

  return result[0] ?? null;
}

export async function deleteStudent(
  studentId: string,
  tenantId: string,
  userId: string,
): Promise<boolean> {
  const existing = await getStudentById(studentId, tenantId);
  if (!existing) {
    return false;
  }

  await db
    .update(students)
    .set({
      deletedAt: new Date(),
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(and(eq(students.id, studentId), eq(students.tenantId, tenantId)));

  return true;
}

export async function duplicateStudent(params: {
  studentId: string;
  tenantId: string;
  userId: string;
}): Promise<Student | null> {
  const { studentId, tenantId, userId } = params;
  const existing = await getStudentById(studentId, tenantId);
  if (!existing) return null;

  const payload: NewStudent = {
    tenantId,
    rollNumber: `${existing.rollNumber}-COPY`,
    fullName: existing.fullName,
    email: existing.email,
    phone: existing.phone,
    course: existing.course,
    semester: existing.semester,
    admissionDate: existing.admissionDate,
    status: existing.status,
    labelIds: existing.labelIds ?? [],
    customFields: existing.customFields ?? {},
    createdBy: userId,
    updatedBy: userId,
  };

  const result = await db.insert(students).values(payload).returning();
  return result[0] ?? null;
}


