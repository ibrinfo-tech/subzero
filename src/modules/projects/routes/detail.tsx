'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ProtectedPage } from '@/core/components/common/ProtectedPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useProjectById } from '../hooks/useProjectById';
import { useProjectTasks } from '../hooks/useProjectTasks';
import { ProjectTaskBoard } from '../components/ProjectTaskBoard';

export default function ProjectDetailPage({ params }: { params?: { id?: string } }) {
  const router = useRouter();
  const projectId = params?.id;

  if (!projectId) {
    return (
      <ProtectedPage permission="projects:read" title="Project Detail">
        <div className="w-full px-4 py-6 space-y-3">
          <div className="text-sm text-destructive">Project ID is missing.</div>
          <Button variant="outline" size="sm" onClick={() => router.push('/projects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to projects
          </Button>
        </div>
      </ProtectedPage>
    );
  }
  const { project, loading: projectLoading } = useProjectById(projectId);
  const { tasks, loading: tasksLoading, saving: tasksSaving, saveTask, deleteTask } = useProjectTasks(projectId);

  const headerTitle = useMemo(() => project?.title || 'Project', [project]);

  const handleSaveTask = async (data: any) => {
    try {
      await saveTask({ ...data, projectId });
      toast.success(data.id ? 'Task updated' : 'Task created');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save task');
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask(id);
      toast.success('Task deleted');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete task');
    }
  };

  return (
    <ProtectedPage permission="projects:read" title="Project Detail">
      <div className="w-full px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/projects')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <div className="text-xl font-semibold">{headerTitle}</div>
              {project && (
                <div className="text-sm text-muted-foreground">
                  {project.clientName || project.projectType || project.status}
                </div>
              )}
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            {projectLoading && <div>Loading project...</div>}
            {project && (
              <>
                <div>Status: {project.status ?? '-'}</div>
                <div>Priority: {project.priority ?? '-'}</div>
                <div>Start: {project.startDate ?? '-'}</div>
                <div>Deadline: {project.deadline ?? '-'}</div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <ProjectTaskBoard
              tasks={tasks}
              loading={tasksLoading}
              saving={tasksSaving}
              onSave={handleSaveTask}
              onDelete={handleDeleteTask}
            />
          </CardContent>
        </Card>
      </div>
    </ProtectedPage>
  );
}

