"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Pencil, Trash2, ChevronRight } from "lucide-react";
import { format, isBefore, startOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { TaskDialog } from "@/components/task-dialog";

interface TaskTag {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  notes: string | null;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  tags: TaskTag[];
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTags, setAllTags] = useState<TaskTag[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchTasks = useCallback(async (tag?: string | null) => {
    setLoadError(null);
    try {
      const params = new URLSearchParams();
      if (tag) params.append("tag", tag);
      const response = await fetch(`/api/tasks?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      } else {
        setLoadError("Failed to load tasks.");
      }
    } catch {
      setLoadError("Failed to load tasks.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch("/api/task-tags");
      if (response.ok) {
        const data = await response.json();
        setAllTags(data);
      }
    } catch {
      // Failed to fetch tags
    }
  }, []);

  useEffect(() => {
    fetchTasks(selectedTag);
    fetchTags();
  }, [fetchTasks, fetchTags, selectedTag]);

  const activeTasks = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((t) => t.completed), [tasks]);

  const handleToggleComplete = async (id: string, currentCompleted: boolean) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !currentCompleted }),
      });
      if (response.ok) {
        fetchTasks(selectedTag);
      }
    } catch {
      alert("Failed to update task");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchTasks(selectedTag);
        fetchTags();
      } else {
        alert("Failed to delete task");
      }
    } catch {
      alert("Failed to delete task");
    }
  };

  const handleSaved = () => {
    fetchTasks(selectedTag);
    fetchTags();
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const getDueDateColor = (dueDate: string | null) => {
    if (!dueDate) return "text-muted-foreground";
    const due = new Date(dueDate);
    const today = startOfDay(new Date());
    return isBefore(due, today) ? "text-destructive" : "text-accent";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {loadError && (
          <div className="mb-4 p-4 rounded-md bg-destructive/10 text-destructive text-sm">
            {loadError}
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
          <Button
            onClick={() => {
              setEditingTask(null);
              setIsDialogOpen(true);
            }}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            + New Task
          </Button>
        </div>

        {/* Tag filter bar */}
        {allTags.length > 0 && (
          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedTag === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => setSelectedTag(tag.name)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedTag === tag.name
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}

        {activeTasks.length === 0 && completedTasks.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {selectedTag
              ? `No tasks with tag "${selectedTag}".`
              : "No tasks yet. Add your first task to get started!"}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {activeTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 rounded-lg border bg-card p-3"
                >
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => handleToggleComplete(task.id, task.completed)}
                    className="h-5 w-5 shrink-0 accent-primary cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">{task.title}</span>
                      {task.tags?.map((tag) => (
                        <span
                          key={tag.id}
                          className="bg-secondary text-muted-foreground rounded-full px-2 py-0.5 text-xs"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                    {task.notes && (
                      <div className="text-sm text-muted-foreground truncate">
                        {task.notes}
                      </div>
                    )}
                  </div>
                  <div className={`text-xs shrink-0 ${getDueDateColor(task.due_date)}`}>
                    {task.due_date
                      ? format(new Date(task.due_date), "MMM d, yyyy")
                      : "No due date"}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(task)}
                      className="h-8 w-8 text-primary hover:text-primary/90 hover:bg-primary/10"
                      title="Edit task"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(task.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      title="Delete task"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {completedTasks.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${showCompleted ? "rotate-90" : ""}`}
                  />
                  Show completed ({completedTasks.length})
                </button>

                {showCompleted && (
                  <div className="mt-3 space-y-2 opacity-50">
                    {completedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 rounded-lg border bg-card p-3"
                      >
                        <input
                          type="checkbox"
                          checked={true}
                          onChange={() => handleToggleComplete(task.id, task.completed)}
                          className="h-5 w-5 shrink-0 accent-primary cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-muted-foreground line-through">
                            {task.title}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground shrink-0">
                          Completed {task.completed_at ? format(new Date(task.completed_at), "MMM d, yyyy") : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <TaskDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingTask(null);
        }}
        onSaved={handleSaved}
        editingTask={editingTask}
      />
    </div>
  );
}
