"use client";

import { useState, useEffect } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  notes: string | null;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
}

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  editingTask?: Task | null;
}

export function TaskDialog({
  open,
  onOpenChange,
  onSaved,
  editingTask,
}: TaskDialogProps) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingTask) {
        setTitle(editingTask.title);
        setNotes(editingTask.notes || "");
        setDueDate(editingTask.due_date ? new Date(editingTask.due_date) : undefined);
      } else {
        setTitle("");
        setNotes("");
        setDueDate(undefined);
      }
    }
  }, [open, editingTask]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    setIsSubmitting(true);

    try {
      const isEditing = !!editingTask;
      const url = isEditing ? `/api/tasks/${editingTask.id}` : "/api/tasks";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          notes: notes.trim() || null,
          due_date: dueDate ? dueDate.toISOString().split("T")[0] : null,
        }),
      });

      if (response.ok) {
        setTitle("");
        setNotes("");
        setDueDate(undefined);
        onOpenChange(false);
        onSaved?.();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save task");
      }
    } catch {
      alert("Failed to save task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setTitle("");
      setNotes("");
      setDueDate(undefined);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingTask ? "Edit Task" : "New Task"}</DialogTitle>
          <DialogDescription>
            {editingTask ? "Update task details" : "Add a new task"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="title"
              placeholder="Task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Notes
            </label>
            <Textarea
              id="notes"
              placeholder="Optional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Due Date</label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "dd/MM/yyyy") : "No due date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {dueDate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDueDate(undefined)}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {isSubmitting ? "Saving..." : "Save Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
