// "use client";

// import {
//   DndContext,
//   DragEndEvent,
//   DragStartEvent,
//   DragOverlay,
// } from "@dnd-kit/core";
// import { useEffect, useState } from "react";
// import { KanbanColumn } from "./components/KanbanColumn";
// import { KanbanTask } from "./components/KanbanTask";
// import { listTasks } from "../../services/taskService";

// type TaskStatus = "todo" | "in_progress" | "completed" | "hold" | "nextsprint";

// type Task = {
//   id: string;
//   title: string;
//   status: TaskStatus;
// };

// const COLUMNS = [
//   { id: "todo", title: "Todo", color: "border-blue-500" },
//   { id: "in_progress", title: "In Progress", color: "border-yellow-500" },
//   { id: "completed", title: "Completed", color: "border-green-500" },
//   { id: "hold", title: "Hold", color: "border-red-500" },
//   { id: "nextsprint", title: "Next Sprint", color: "border-purple-500" },
// ];

// export default function KanbanBoard() {
//   const [tasks, setTasks] = useState<Task[]>([
//     { id: "1", title: "Design UI", status: "todo" },
//     { id: "2", title: "API Integration", status: "in_progress" },
//     { id: "3", title: "Testing", status: "completed" },
//     { id: "4", title: "Testing", status: "completed" },
//     { id: "5", title: "Testing", status: "completed" },
//   ]);

//   const [activeTask, setActiveTask] = useState<Task | null>(null);

//   const handleDragStart = (event: DragStartEvent) => {
//     const task = tasks.find((t) => t.id === event.active.id);
//     if (task) setActiveTask(task);
//   };

//   const handleDragEnd = (event: DragEndEvent) => {
//     const { active, over } = event;
//     setActiveTask(null);

//     if (!over) return;

//     const taskId = active.id as string;
//     const newStatus = over.id as TaskStatus;

//     setTasks((prev) =>
//       prev.map((task) =>
//         task.id === taskId ? { ...task, status: newStatus } : task
//       )
//     );

//     // 🔁 API call here
//     // updateTaskStatus(taskId, newStatus)
//   };

//   useEffect(() => {
//     console.log("Thiss is sdj odosf ")
//   },[])

//   return (
//     <DndContext
//       onDragStart={handleDragStart}
//       onDragEnd={handleDragEnd}
//     >
//       <div className="flex gap-4 overflow-x-auto h-screen p-4">
//         {COLUMNS.map((col) => (
//           <div key={col.id} className="min-w-[300px] h-full">
//             <KanbanColumn
//               column={col}
//               tasks={tasks.filter((t) => t.status === col.id)}
//             />
//           </div>
//         ))}
//       </div>

//       {/* 🔥 THIS FIXES THE ISSUE */}
//       <DragOverlay>
//         {activeTask ? <KanbanTask task={activeTask} /> : null}
//       </DragOverlay>
//     </DndContext>
//   );
// }



"use client";

import { useEffect, useState } from "react";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay } from "@dnd-kit/core";
import { KanbanColumn } from "./components/KanbanColumn";
import { KanbanTask } from "./components/KanbanTask";
import { fetchTasks, updateTask, Task } from "./helpers/index";

type TaskStatus = "todo" | "in_progress" | "completed" | "hold" | "nextsprint";

const COLUMNS = [
  { id: "todo", title: "Todo", color: "border-blue-500" },
  { id: "in_progress", title: "In Progress", color: "border-yellow-500" },
  { id: "completed", title: "Completed", color: "border-green-500" },
  { id: "hold", title: "Hold", color: "border-red-500" },
  { id: "nextsprint", title: "Next Sprint", color: "border-purple-500" },
];

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data : any = await fetchTasks();
        if(data?.success){
          setTasks(data?.data);
        }
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await updateTask(taskId, { status: newStatus });
    } catch (err) {
      console.error(err);
      // Optional: revert UI on failure
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: activeTask?.status! } : t))
      );
    }
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto h-screen p-4">
        {COLUMNS.map((col) => (
          <div key={col.id} className="min-w-[300px] h-full">
            <KanbanColumn
              column={col}
              tasks={tasks?.filter((t) => t?.status === col?.id)}
            />
          </div>
        ))}
      </div>

      <DragOverlay>
        {activeTask ? <KanbanTask task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
