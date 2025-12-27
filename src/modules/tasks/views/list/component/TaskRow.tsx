"use client";

import { useState } from "react";
import { Checkbox } from "@/core/components/ui/checkbox";
import { Button } from "@/core/components/ui/button";
import { MoreVertical, Calendar, User } from "lucide-react";
import { cn } from "@/core/lib/utils";
import type { TaskRecord } from "../../../types";
import { TASK_STATUSES } from "../../../utils/constants";

interface Props {
  task: TaskRecord;
  onEdit?: (task: TaskRecord) => void;
  onToggleComplete?: (task: TaskRecord) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "todo":
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    case "in_progress":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "blocked":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  const yesterday = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  yesterday.setDate(yesterday.getDate() - 1);

  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  if (date.getTime() === today.getTime()) {
    return "Today";
  }
  if (date.getTime() === tomorrow.getTime()) {
    return "Tomorrow";
  }
  if (date.getTime() === yesterday.getTime()) {
    return "Yesterday";
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const getInitials = (name: string | null | undefined) => {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
};

const getAvatarColor = (str: string) => {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-red-500",
    "bg-orange-500",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export function TaskRow({ task, onEdit, onToggleComplete }: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const isCompleted = task.status === "completed";
  const statusLabel =
    TASK_STATUSES.find((s) => s.value === task.status)?.label || task.status;
  const dueDateFormatted = formatDate(task.dueDate);

  return (
    <div
      className={cn(
        "grid grid-cols-[40px_1fr_120px_120px_120px_40px] px-15 py-3 items-center",
        "hover:bg-accent/50 cursor-pointer group transition-colors",
        isCompleted && "opacity-60"
      )}
      onClick={() => onEdit?.(task)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Checkbox */}
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isCompleted}
          onCheckedChange={() => onToggleComplete?.(task)}
          className="h-4 w-4"
        />
      </div>

      {/* Name */}
      <div className="min-w-0">
        <div
          className={cn(
            "font-medium truncate text-foreground",
            isCompleted && "text-muted-foreground"
          )}
        >
          {task.title}
        </div>
        {/* {task.description && (
          <div className="text-xs text-muted-foreground truncate mt-0.5">
            {task.description}
          </div>
        )} */}
      </div>

      {/* Assignee */}
      <div className="flex justify-center">
        {task.assignedTo ? (
          <div
            className={cn(
              "h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium text-white",
              getAvatarColor(task.assignedTo)
            )}
            title={task.assignedTo}
          >
            {task.assignedTo.length > 20
              ? task.assignedTo.substring(0, 2).toUpperCase()
              : getInitials(task.assignedTo)}
          </div>
        ) : (
          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Due Date */}
      <div className="text-center text-sm">
        {dueDateFormatted ? (
          <span className="inline-flex items-center gap-1 text-foreground">
            <Calendar className="h-3 w-3" />
            {dueDateFormatted}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </div>

      {/* Status */}
      <div className="text-center">
        <span
          className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
            getStatusColor(task.status)
          )}
        >
          {statusLabel}
        </span>
      </div>

      {/* Actions */}
      <div
        className={cn(
          "flex justify-center",
          isHovered ? "opacity-100" : "opacity-0"
        )}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={(e) => {
            e.stopPropagation();
            // Menu actions can be added here
          }}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
