"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  RefreshCcw,
  Download,
  Upload,
  Filter,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ProtectedPage } from "@/core/components/common/ProtectedPage";
import { Button } from "@/core/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import { Input } from "@/core/components/ui/input";
import { Select } from "@/core/components/ui/select";
import { LoadingSpinner } from "@/core/components/common/LoadingSpinner";
import { usePermissions } from "@/core/hooks/usePermissions";
import { useDebounce } from "@/core/hooks/useDebounce";
import { useAuthStore } from "@/core/store/authStore";
import type { TaskRecord, CreateTaskInput, TaskSection } from "../../../types";
import { TaskForm } from "../../../components/TaskForm";
import { TASK_STATUSES, TASK_PRIORITIES } from "../../../utils/constants";
import { TaskSectionedListView } from "./TaskSectionedListView";
import { mapTasksToSections } from "../utils/selectors";
import { InlineAddSectionRow } from "./InlineAddSectionRow";
import { AddSectionTrigger } from "./AddSectionTrigger";

const getDefaultForm = (sectionId?: string): CreateTaskInput => ({
  title: "",
  description: "",
  status: "todo",
  priority: "normal",
  dueDate: undefined,
  assignedTo: undefined,
  relatedEntityType: undefined,
  relatedEntityId: undefined,
  customFields: {},
  sectionId: sectionId || "", // Will be set when creating
});

export default function TasksListPage() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assignedToFilter, setAssignedToFilter] = useState<string>("all");
  const [showOverdue, setShowOverdue] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateTaskInput>(getDefaultForm());
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TaskRecord | null>(null);

  const { hasPermission } = usePermissions();
  const { user: currentUser } = useAuthStore();
  const debouncedSearch = useDebounce(search, 500);

  // Section state
  const [sections, setSections] = useState<TaskSection[]>([]);
  const [creatingSection, setCreatingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Inline task creation/editing state
  const [creatingTaskInSectionId, setCreatingTaskInSectionId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Derived data - map tasks to sections at render time
  const sectionedData = mapTasksToSections(sections, tasks);

  const canCreate = hasPermission("tasks:create") || hasPermission("tasks:*");
  const canUpdate = hasPermission("tasks:update") || hasPermission("tasks:*");
  const canDelete = hasPermission("tasks:delete") || hasPermission("tasks:*");
  const canExport = hasPermission("tasks:export") || hasPermission("tasks:*");
  const canImport = hasPermission("tasks:import") || hasPermission("tasks:*");
  const canComplete =
    hasPermission("tasks:complete") || hasPermission("tasks:*");

  // Fetch tasks - COMMENTED OUT FOR UX TESTING
  // const fetchTasks = useCallback(async () => {
  //   setLoading(true);
  //   try {
  //     const params = new URLSearchParams();
  //     if (debouncedSearch) params.set("search", debouncedSearch);
  //     if (statusFilter !== "all") params.set("status", statusFilter);
  //     if (priorityFilter !== "all") params.set("priority", priorityFilter);
  //     if (assignedToFilter !== "all") {
  //       if (assignedToFilter === "me") {
  //         params.set("assignedTo", "me");
  //       } else {
  //         params.set("assignedTo", assignedToFilter);
  //       }
  //     }
  //     if (showOverdue) params.set("overdue", "true");

  //     const query = params.toString();
  //     const url = query ? `/api/tasks?${query}` : "/api/tasks";

  //     const res = await fetch(url);
  //     const json = await res.json();

  //     if (res.ok && json.success) {
  //       setTasks(json.data ?? []);
  //     } else {
  //       toast.error(json.error || "Failed to load tasks");
  //     }
  //   } catch (error) {
  //     console.error("Task fetch error:", error);
  //     toast.error("Failed to load tasks");
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [
  //   debouncedSearch,
  //   statusFilter,
  //   priorityFilter,
  //   assignedToFilter,
  //   showOverdue,
  // ]);

  // Fetch sections - COMMENTED OUT FOR UX TESTING
  // const fetchSections = useCallback(async () => {
  //   try {
  //     const res = await fetch("/api/task-sections");
  //     const json = await res.json();

  //     if (res.ok && json.success) {
  //       setSections(json.data ?? []);
  //     } else {
  //       console.error("Failed to load sections:", json.error);
  //     }
  //   } catch (error) {
  //     console.error("Section fetch error:", error);
  //   }
  // }, []);

  // Dummy data for UX testing
  useEffect(() => {
    // Dummy sections
    const dummySections: TaskSection[] = [
      { id: "section-1", title: "Phase 2 : Module Development", order: 0 },
      { id: "section-2", title: "Untitled section", order: 1 },
    ];
    setSections(dummySections);
    // Expand all sections by default
    setExpandedSections(new Set(dummySections.map(s => s.id)));

    // Dummy tasks
    const dummyTasks: TaskRecord[] = [
      {
        id: "task-1",
        tenantId: null,
        projectId: null,
        title: "Kanban View Module",
        description: "Implement kanban board view for tasks",
        status: "in_progress",
        priority: "high",
        dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        assignedTo: "HS",
        createdBy: "user-1",
        relatedEntityType: null,
        relatedEntityId: null,
        customFields: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
        sectionId: "section-1",
      },
      {
        id: "task-2",
        tenantId: null,
        projectId: null,
        title: "List View Module",
        description: "Implement list view similar to Asana",
        status: "todo",
        priority: "normal",
        dueDate: new Date().toISOString(), // Today
        assignedTo: "J",
        createdBy: "user-1",
        relatedEntityType: null,
        relatedEntityId: null,
        customFields: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
        sectionId: "section-1",
      },
      {
        id: "task-3",
        tenantId: null,
        projectId: null,
        title: "Audit Logs Module",
        description: "Track all system changes",
        status: "completed",
        priority: "normal",
        dueDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        assignedTo: "PR",
        createdBy: "user-1",
        relatedEntityType: null,
        relatedEntityId: null,
        customFields: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
        sectionId: "section-1",
      },
      {
        id: "task-4",
        tenantId: null,
        projectId: null,
        title: "multiple module join queries",
        description: "Optimize database queries",
        status: "completed",
        priority: "low",
        dueDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        assignedTo: "Abhishek Sh...",
        createdBy: "user-1",
        relatedEntityType: null,
        relatedEntityId: null,
        customFields: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
        sectionId: "section-2",
      },
      {
        id: "task-5",
        tenantId: null,
        projectId: null,
        title: "Reference in custom fields",
        description: "Add reference support to custom fields",
        status: "completed",
        priority: "normal",
        dueDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        assignedTo: "Abhishek Sh...",
        createdBy: "user-1",
        relatedEntityType: null,
        relatedEntityId: null,
        customFields: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
        sectionId: "section-2",
      },
    ];
    setTasks(dummyTasks);

    // Uncomment when ready to use real API
    // fetchTasks();
    // fetchSections();
  }, []);

  // Inline section creation handlers
  const submitNewSection = async () => {
    const title = newSectionTitle.trim();
    if (!title) {
      setCreatingSection(false);
      setNewSectionTitle("");
      return;
    }

    // DUMMY DATA - Create section locally for UX testing
    const newSection: TaskSection = {
      id: `section-${Date.now()}`,
      title,
      order: sections.length,
    };
    setSections((prev) => [...prev, newSection]);
    // Auto-expand new section
    setExpandedSections((prev) => new Set([...prev, newSection.id]));
    setNewSectionTitle("");
    setCreatingSection(false);
    toast.success("Section created");

    // Uncomment when ready to use real API
    // try {
    //   const res = await fetch("/api/task-sections", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       title,
    //       order: sections.length,
    //     }),
    //   });

    //   const json = await res.json();

    //   if (res.ok && json.success) {
    //     setSections((prev) => [...prev, json.data]);
    //     setNewSectionTitle("");
    //     setCreatingSection(false);
    //   } else {
    //     toast.error(json.error || "Failed to create section");
    //   }
    // } catch (error) {
    //   console.error("Section creation error:", error);
    //   toast.error("Failed to create section");
    // }
  };

  const cancelNewSection = () => {
    setNewSectionTitle("");
    setCreatingSection(false);
  };

  // Inline task creation handlers
  const handleStartAddTask = (sectionId: string) => {
    if (!canCreate) {
      toast.error("You do not have permission to create tasks");
      return;
    }
    setCreatingTaskInSectionId(sectionId);
  };

  const handleCreateTask = async (sectionId: string, title: string) => {
    if (!canCreate) {
      toast.error("You do not have permission to create tasks");
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setCreatingTaskInSectionId(null);
      return;
    }

    // DUMMY DATA - Create task locally for UX testing
    const newTask: TaskRecord = {
      id: `task-${Date.now()}`,
      tenantId: null,
      projectId: null,
      title: trimmedTitle,
      description: null,
      status: "todo",
      priority: "normal",
      dueDate: null,
      assignedTo: null,
      createdBy: currentUser?.id || "user-1",
      relatedEntityType: null,
      relatedEntityId: null,
      customFields: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      sectionId: sectionId,
    };
    setTasks((prev) => [...prev, newTask]);
    setCreatingTaskInSectionId(null);
    toast.success("Task created");

    // Uncomment when ready to use real API
    // try {
    //   const res = await fetch("/api/tasks", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       title: trimmedTitle,
    //       status: "todo",
    //       priority: "normal",
    //       sectionId: sectionId,
    //       createdBy: currentUser?.id,
    //     }),
    //   });

    //   const json = await res.json();

    //   if (res.ok && json.success) {
    //     setTasks((prev) => [...prev, json.data]);
    //     setCreatingTaskInSectionId(null);
    //   } else {
    //     toast.error(json.error || "Failed to create task");
    //   }
    // } catch (error) {
    //   console.error("Task creation error:", error);
    //   toast.error("Failed to create task");
    // }
  };

  const handleCancelAddTask = () => {
    setCreatingTaskInSectionId(null);
  };

  // Section handlers
  const handleToggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleEditSectionTitle = (sectionId: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;

    // DUMMY DATA - Update section locally for UX testing
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, title: trimmed } : s))
    );
    toast.success("Section title updated");

    // Uncomment when ready to use real API
    // try {
    //   const res = await fetch(`/api/task-sections/${sectionId}`, {
    //     method: "PATCH",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ title: trimmed }),
    //   });
    //   const json = await res.json();
    //   if (res.ok && json.success) {
    //     setSections((prev) =>
    //       prev.map((s) => (s.id === sectionId ? json.data : s))
    //     );
    //   }
    // } catch (error) {
    //   console.error("Section update error:", error);
    //   toast.error("Failed to update section");
    // }
  };

  // Task edit handlers - Inline editing (no modal)
  const openEdit = (task: TaskRecord) => {
    if (!canUpdate) {
      toast.error("You do not have permission to update tasks");
      return;
    }
    setEditingTaskId(task.id);
  };

  const handleSaveTask = async (updatedTask: TaskRecord) => {
    if (!canUpdate) {
      toast.error("You do not have permission to update tasks");
      return;
    }

    // DUMMY DATA - Update task locally for UX testing
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
    setEditingTaskId(null);
    toast.success("Task updated");

    // Uncomment when ready to use real API
    // try {
    //   const res = await fetch(`/api/tasks/${updatedTask.id}`, {
    //     method: "PATCH",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify(updatedTask),
    //   });
    //   const json = await res.json();
    //   if (res.ok && json.success) {
    //     setTasks((prev) =>
    //       prev.map((t) => (t.id === updatedTask.id ? json.data : t))
    //     );
    //     setEditingTaskId(null);
    //   }
    // } catch (error) {
    //   console.error("Task update error:", error);
    //   toast.error("Failed to update task");
    // }
  };

  const handleCancelEditTask = () => {
    setEditingTaskId(null);
  };

  const saveTask = async () => {
    if (editingId && !canUpdate) {
      toast.error("You do not have permission to update tasks");
      return;
    }
    if (!editingId && !canCreate) {
      toast.error("You do not have permission to create tasks");
      return;
    }

    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) {
      toast.error("Title is required");
      return;
    }

    // Ensure sectionId is set for new tasks
    if (!editingId && !form.sectionId) {
      // If no section exists, create a default one or use first section
      if (sections.length === 0) {
        toast.error("Please create a section first");
        return;
      }
      form.sectionId = sections[0].id;
    }

    // Ensure sectionId is set for updates too (in case it's missing)
    if (editingId && !form.sectionId) {
      if (sections.length === 0) {
        toast.error("Please create a section first");
        return;
      }
      form.sectionId = sections[0].id;
    }

    setSaving(true);
    try {
      const method = editingId ? "PATCH" : "POST";
      const url = editingId ? `/api/tasks/${editingId}` : "/api/tasks";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, title: trimmedTitle }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save task");
      }

      setDialogOpen(false);
      setForm(getDefaultForm());
      setEditingId(null);
      // DUMMY DATA - Update task locally for UX testing
      if (editingId) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === editingId
              ? { ...t, ...form, title: trimmedTitle, updatedAt: new Date().toISOString() }
              : t
          )
        );
      } else {
        const newTask: TaskRecord = {
          id: `task-${Date.now()}`,
          tenantId: null,
          projectId: null,
          title: trimmedTitle,
          description: form.description || null,
          status: form.status || "todo",
          priority: form.priority || "normal",
          dueDate: form.dueDate || null,
          assignedTo: form.assignedTo || null,
          createdBy: currentUser?.id || "user-1",
          relatedEntityType: form.relatedEntityType || null,
          relatedEntityId: form.relatedEntityId || null,
          customFields: form.customFields || {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
          sectionId: form.sectionId,
        };
        setTasks((prev) => [...prev, newTask]);
      }
      // Uncomment when ready to use real API
      // fetchTasks();
      toast.success(editingId ? "Task updated" : "Task created");
    } catch (error) {
      console.error("Task save error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to save task";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (task: TaskRecord) => {
    if (!canDelete) {
      toast.error("You do not have permission to delete tasks");
      return;
    }
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;

    // DUMMY DATA - Delete task locally for UX testing
    setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
    setDeleteDialogOpen(false);
    setTaskToDelete(null);
    toast.success("Task deleted successfully");

    // Uncomment when ready to use real API
    // try {
    //   const res = await fetch(`/api/tasks/${taskToDelete.id}`, {
    //     method: "DELETE",
    //   });

    //   const json = await res.json();
    //   if (!res.ok || !json.success) {
    //     throw new Error(json.error || "Failed to delete task");
    //   }

    //   setDeleteDialogOpen(false);
    //   setTaskToDelete(null);
    //   fetchTasks();
    //   toast.success("Task deleted successfully");
    // } catch (error) {
    //   console.error("Task delete error:", error);
    //   const message =
    //     error instanceof Error ? error.message : "Failed to delete task";
    //   toast.error(message);
    // }
  };

  const handleToggleComplete = async (task: TaskRecord) => {
    if (!canComplete) {
      toast.error("You do not have permission to complete tasks");
      return;
    }

    const newStatus = task.status === "completed" ? "todo" : "completed";

    // DUMMY DATA - Update task locally for UX testing
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus as any, updatedAt: new Date().toISOString() } : t))
    );
    toast.success(newStatus === "completed" ? "Task completed" : "Task reopened");

    // Uncomment when ready to use real API
    // try {
    //   const res = await fetch(`/api/tasks/${task.id}`, {
    //     method: "PATCH",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ status: newStatus }),
    //   });

    //   const json = await res.json();
    //   if (!res.ok || !json.success) {
    //     throw new Error(json.error || "Failed to update task status");
    //   }

    //   // Optimistically update local state
    //   setTasks((prev) =>
    //     prev.map((t) => (t.id === task.id ? { ...t, status: newStatus as any } : t))
    //   );
    // } catch (error) {
    //   console.error("Task status update error:", error);
    //   const message =
    //     error instanceof Error ? error.message : "Failed to update task status";
    //   toast.error(message);
    //   // Refetch on error
    //   fetchTasks();
    // }
  };

  const handleExport = async () => {
    if (!canExport) {
      toast.error("You do not have permission to export tasks");
      return;
    }

    try {
      const res = await fetch("/api/tasks/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filters: {
            search: debouncedSearch,
            status: statusFilter !== "all" ? statusFilter : undefined,
            priority: priorityFilter !== "all" ? priorityFilter : undefined,
            assignedTo:
              assignedToFilter !== "all" ? assignedToFilter : undefined,
            overdue: showOverdue,
          },
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to export tasks");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tasks-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Tasks exported successfully");
    } catch (error) {
      console.error("Task export error:", error);
      toast.error("Failed to export tasks");
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!canImport) {
      toast.error("You do not have permission to import tasks");
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/tasks/import", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to import tasks");
      }

      // DUMMY DATA - Skip import for UX testing
      // fetchTasks();
      toast.success(
        `Successfully imported ${json.data?.imported || 0} task(s)`
      );
    } catch (error) {
      console.error("Task import error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to import tasks";
      toast.error(message);
    } finally {
      event.target.value = "";
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setAssignedToFilter("all");
    setShowOverdue(false);
  };

  const hasActiveFilters =
    search ||
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    assignedToFilter !== "all" ||
    showOverdue;

  const statusOptions = [
    { value: "all", label: "All Statuses" },
    ...TASK_STATUSES.map((s) => ({ value: s.value, label: s.label })),
  ];

  const priorityOptions = [
    { value: "all", label: "All Priorities" },
    ...TASK_PRIORITIES.map((p) => ({ value: p.value, label: p.label })),
  ];

  const assignedToOptions = [
    { value: "all", label: "All Assignees" },
    { value: "me", label: "My Tasks" },
    { value: "unassigned", label: "Unassigned" },
  ];

  if (loading && tasks.length === 0 && sections.length === 0) {
    return (
      <ProtectedPage
        permission="tasks:read"
        title="Tasks"
        description="Manage tasks with assignment, status, priority, and due dates"
      >
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage
      permission="tasks:read"
      title="Tasks"
      description="Manage tasks with assignment, status, priority, and due dates"
    >
      <div className="w-full py-6 space-y-4">
        <div>
          <div className="flex flex-row items-center justify-between space-y-0 mb-6">
            <CardTitle className="text-2xl font-bold">Tasks</CardTitle>
            <div className="flex gap-2">
              {canExport && (
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
              {canImport && (
                <label className="cursor-pointer">
                  <span className="inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // DUMMY DATA - Refresh is disabled for UX testing
                  toast.info("Using dummy data - refresh disabled");
                  // Uncomment when ready to use real API
                  // fetchTasks();
                }}
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-12">
              <div className="flex flex-1 gap-2">
                <div className="relative flex-1 max-w-md">
                  <Input
                    placeholder="Search tasks..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={statusOptions}
                  className="w-[140px]"
                />
                <Select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  options={priorityOptions}
                  className="w-[140px]"
                />
                <Select
                  value={assignedToFilter}
                  onChange={(e) => setAssignedToFilter(e.target.value)}
                  options={assignedToOptions}
                  className="w-[140px]"
                />
                <Button
                  variant={showOverdue ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowOverdue(!showOverdue)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Overdue
                </Button>
              </div>
            </div>

            {/* Main List View with Sections */}
            <TaskSectionedListView
              sections={sectionedData}
              expandedSections={expandedSections}
              creatingTaskInSectionId={creatingTaskInSectionId}
              editingTaskId={editingTaskId}
              onToggleSection={handleToggleSection}
              onEditSectionTitle={handleEditSectionTitle}
              onAddTask={handleStartAddTask}
              onCreateTask={handleCreateTask}
              onCancelAddTask={handleCancelAddTask}
              onEdit={canUpdate ? openEdit : undefined}
              onSaveTask={canUpdate ? handleSaveTask : undefined}
              onCancelEditTask={handleCancelEditTask}
              onToggleComplete={canComplete ? handleToggleComplete : undefined}
            />

            {/* Add Section Row */}
            {creatingSection ? (
              <InlineAddSectionRow
                value={newSectionTitle}
                onChange={setNewSectionTitle}
                onSubmit={submitNewSection}
                onCancel={cancelNewSection}
              />
            ) : (
              <AddSectionTrigger onClick={() => setCreatingSection(true)} />
            )}
          </div>
        </div>

        {/* Edit Task Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Task" : "New Task"}</DialogTitle>
            </DialogHeader>
            <div className="px-6 py-4">
              <TaskForm form={form} onChange={setForm} />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setForm(getDefaultForm());
                  setEditingId(null);
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={saveTask} disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Task Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Task</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>
                Are you sure you want to delete "{taskToDelete?.title}"? This
                action cannot be undone.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedPage>
  );
}
