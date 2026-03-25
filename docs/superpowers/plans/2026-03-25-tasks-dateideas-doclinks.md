# Tasks, Date Ideas, and Doc Links Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three new independent features to Logger — Tasks, Date Ideas, and Doc Links — each with their own Prisma models, API routes, dialog components, and pages plus sidebar navigation.

**Architecture:** Three independent feature verticals, each following the existing Entry/EntryType pattern: Prisma model → API route handlers → Dialog component → Page component. DocLinks adds a Tag model with many-to-many relation. All features are standalone with no dependencies on each other.

**Tech Stack:** Next.js 15 App Router, Prisma 6, PostgreSQL, React 19, shadcn/ui, Tailwind CSS 4, Lucide React icons.

**Spec:** `docs/superpowers/specs/2026-03-25-tasks-dateideas-doclinks-design.md`

---

## Chunk 1: Database Schema and Migration

### Task 1: Add Prisma models

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add Task model to schema**

Add after the Vocabulary model in `prisma/schema.prisma`:

```prisma
model Task {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  created_at   DateTime  @default(now())
  updated_at   DateTime  @updatedAt
  title        String
  notes        String?
  due_date     DateTime? @db.Date
  completed    Boolean   @default(false)
  completed_at DateTime?
}
```

- [ ] **Step 2: Add DateIdea model to schema**

Add after the Task model:

```prisma
model DateIdea {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  created_at   DateTime  @default(now())
  updated_at   DateTime  @updatedAt
  name         String
  description  String?
  completed    Boolean   @default(false)
  completed_at DateTime?
  review       String?
}
```

- [ ] **Step 3: Add Tag and DocLink models to schema**

Add after the DateIdea model:

```prisma
model Tag {
  id         String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt
  name       String    @unique
  doc_links  DocLink[]
}

model DocLink {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  title       String
  url         String
  description String?
  tags        Tag[]
}
```

- [ ] **Step 4: Generate migration and apply**

Run:
```bash
npx prisma migrate dev --name add_tasks_dateideas_doclinks
```

Expected: Migration created and applied successfully. Prisma client regenerated.

- [ ] **Step 5: Verify Prisma client generation**

Run:
```bash
npx prisma generate
```

Expected: "Generated Prisma Client" output.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add Task, DateIdea, DocLink, and Tag models"
```

---

## Chunk 2: Tasks API Routes

### Task 2: Tasks list and create API

**Files:**
- Create: `src/app/api/tasks/route.ts`

- [ ] **Step 1: Create tasks list and create route**

Create `src/app/api/tasks/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const completed = searchParams.get("completed");

    const where: { completed?: boolean } = {};
    if (completed !== null) {
      where.completed = completed === "true";
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { due_date: { sort: "asc", nulls: "last" } },
        { created_at: "desc" },
      ],
    });

    return NextResponse.json(tasks);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, notes, due_date } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        notes: notes?.trim() || null,
        due_date: due_date ? new Date(due_date) : null,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verify route compiles**

Run:
```bash
npx next build --no-lint 2>&1 | head -20
```

Or start dev server and test with curl:
```bash
curl http://localhost:3000/api/tasks
```

Expected: `[]` (empty array)

### Task 3: Tasks single-item API

**Files:**
- Create: `src/app/api/tasks/[id]/route.ts`

- [ ] **Step 1: Create tasks single-item route**

Create `src/app/api/tasks/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, notes, due_date, completed } = body;

    if (title !== undefined && (typeof title !== "string" || title.trim().length === 0)) {
      return NextResponse.json(
        { error: "Title cannot be empty" },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title.trim();
    if (notes !== undefined) data.notes = notes?.trim() || null;
    if (due_date !== undefined) data.due_date = due_date ? new Date(due_date) : null;
    if (completed !== undefined) {
      data.completed = completed;
      data.completed_at = completed ? new Date() : null;
    }

    const task = await prisma.task.update({
      where: { id },
      data,
    });

    return NextResponse.json(task);
  } catch {
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/tasks/
git commit -m "feat: add Tasks API routes (list, create, get, update, delete)"
```

---

## Chunk 3: Date Ideas API Routes

### Task 4: Date Ideas list and create API

**Files:**
- Create: `src/app/api/date-ideas/route.ts`

- [ ] **Step 1: Create date-ideas list and create route**

Create `src/app/api/date-ideas/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const completed = searchParams.get("completed");

    const where: { completed?: boolean } = {};
    if (completed !== null) {
      where.completed = completed === "true";
    }

    const ideas = await prisma.dateIdea.findMany({
      where,
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(ideas);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch date ideas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const idea = await prisma.dateIdea.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json(idea, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create date idea" },
      { status: 500 }
    );
  }
}
```

### Task 5: Date Ideas single-item API

**Files:**
- Create: `src/app/api/date-ideas/[id]/route.ts`

- [ ] **Step 1: Create date-ideas single-item route**

Create `src/app/api/date-ideas/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const idea = await prisma.dateIdea.findUnique({
      where: { id },
    });

    if (!idea) {
      return NextResponse.json(
        { error: "Date idea not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(idea);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch date idea" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, completed, review } = body;

    if (name !== undefined && (typeof name !== "string" || name.trim().length === 0)) {
      return NextResponse.json(
        { error: "Name cannot be empty" },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name.trim();
    if (description !== undefined) data.description = description?.trim() || null;
    if (review !== undefined) data.review = review?.trim() || null;
    if (completed !== undefined) {
      data.completed = completed;
      data.completed_at = completed ? new Date() : null;
      if (!completed) data.review = null;
    }

    const idea = await prisma.dateIdea.update({
      where: { id },
      data,
    });

    return NextResponse.json(idea);
  } catch {
    return NextResponse.json(
      { error: "Failed to update date idea" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.dateIdea.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete date idea" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/date-ideas/
git commit -m "feat: add Date Ideas API routes (list, create, get, update, delete)"
```

---

## Chunk 4: Doc Links and Tags API Routes

### Task 6: Tags list API

**Files:**
- Create: `src/app/api/tags/route.ts`

- [ ] **Step 1: Create tags list route**

Create `src/app/api/tags/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(tags);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}
```

### Task 7: Doc Links list and create API

**Files:**
- Create: `src/app/api/doc-links/route.ts`

- [ ] **Step 1: Create doc-links list and create route**

Create `src/app/api/doc-links/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag");

    const where = tag
      ? { tags: { some: { name: tag } } }
      : {};

    const links = await prisma.docLink.findMany({
      where,
      include: { tags: true },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(links);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch doc links" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, url, description, tags } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!url || typeof url !== "string" || url.trim().length === 0) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    const tagConnections = tags && Array.isArray(tags)
      ? tags
          .map((t: string) => t.trim())
          .filter((t: string) => t.length > 0)
          .map((t: string) => ({
            where: { name: t },
            create: { name: t },
          }))
      : [];

    const link = await prisma.docLink.create({
      data: {
        title: title.trim(),
        url: url.trim(),
        description: description?.trim() || null,
        tags: {
          connectOrCreate: tagConnections,
        },
      },
      include: { tags: true },
    });

    return NextResponse.json(link, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create doc link" },
      { status: 500 }
    );
  }
}
```

### Task 8: Doc Links single-item API

**Files:**
- Create: `src/app/api/doc-links/[id]/route.ts`

- [ ] **Step 1: Create doc-links single-item route**

Create `src/app/api/doc-links/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const link = await prisma.docLink.findUnique({
      where: { id },
      include: { tags: true },
    });

    if (!link) {
      return NextResponse.json(
        { error: "Doc link not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(link);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch doc link" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, url, description, tags } = body;

    if (title !== undefined && (typeof title !== "string" || title.trim().length === 0)) {
      return NextResponse.json(
        { error: "Title cannot be empty" },
        { status: 400 }
      );
    }

    if (url !== undefined && (typeof url !== "string" || url.trim().length === 0)) {
      return NextResponse.json(
        { error: "URL cannot be empty" },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title.trim();
    if (url !== undefined) data.url = url.trim();
    if (description !== undefined) data.description = description?.trim() || null;

    if (tags !== undefined && Array.isArray(tags)) {
      const tagNames = tags
        .map((t: string) => t.trim())
        .filter((t: string) => t.length > 0);

      data.tags = {
        set: [],
        connectOrCreate: tagNames.map((t: string) => ({
          where: { name: t },
          create: { name: t },
        })),
      };
    }

    const link = await prisma.docLink.update({
      where: { id },
      data,
      include: { tags: true },
    });

    return NextResponse.json(link);
  } catch {
    return NextResponse.json(
      { error: "Failed to update doc link" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.docLink.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete doc link" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/doc-links/ src/app/api/tags/
git commit -m "feat: add Doc Links and Tags API routes"
```

---

## Chunk 5: Sidebar Update

### Task 9: Add new navigation items to sidebar

**Files:**
- Modify: `src/components/sidebar.tsx`

- [ ] **Step 1: Add three new sidebar items**

In `src/components/sidebar.tsx`:

1. Update the import line to add new icons (note: `Link` is aliased to `LinkIcon` to avoid collision with `next/link`'s `Link`):
```typescript
import { BookOpen, FileText, Bot, BarChart3, CheckSquare, Heart, Link as LinkIcon } from "lucide-react";
```

2. Add three entries to the `navigation` array after the Reports entry:
```typescript
  {
    name: "Tasks",
    href: "/tasks",
    icon: CheckSquare,
  },
  {
    name: "Date Ideas",
    href: "/date-ideas",
    icon: Heart,
  },
  {
    name: "Doc Links",
    href: "/doc-links",
    icon: LinkIcon,
  },
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sidebar.tsx
git commit -m "feat: add Tasks, Date Ideas, Doc Links to sidebar navigation"
```

---

## Chunk 6: Task Dialog Component and Page

### Task 10: Create Task dialog component

**Files:**
- Create: `src/components/task-dialog.tsx`

- [ ] **Step 1: Create the task dialog**

Create `src/components/task-dialog.tsx`:

```typescript
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
```

### Task 11: Create Tasks page

**Files:**
- Create: `src/app/tasks/page.tsx`

- [ ] **Step 1: Create the tasks page**

Create `src/app/tasks/page.tsx`:

```typescript
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Pencil, Trash2, ChevronRight } from "lucide-react";
import { format, isBefore, startOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { TaskDialog } from "@/components/task-dialog";

interface Task {
  id: string;
  title: string;
  notes: string | null;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoadError(null);
    try {
      const response = await fetch("/api/tasks");
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

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

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
        fetchTasks();
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
        fetchTasks();
      } else {
        alert("Failed to delete task");
      }
    } catch {
      alert("Failed to delete task");
    }
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

        {activeTasks.length === 0 && completedTasks.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No tasks yet. Add your first task to get started!
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
                    <div className="font-semibold text-foreground">{task.title}</div>
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
        onSaved={fetchTasks}
        editingTask={editingTask}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/task-dialog.tsx src/app/tasks/
git commit -m "feat: add Tasks page with dialog for create/edit"
```

---

## Chunk 7: Date Ideas Dialog Components and Page

### Task 12: Create Date Idea dialog component

**Files:**
- Create: `src/components/date-idea-dialog.tsx`

- [ ] **Step 1: Create the date idea dialog**

Create `src/components/date-idea-dialog.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DateIdea {
  id: string;
  name: string;
  description: string | null;
  completed: boolean;
  completed_at: string | null;
  review: string | null;
}

interface DateIdeaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  editingIdea?: DateIdea | null;
}

export function DateIdeaDialog({
  open,
  onOpenChange,
  onSaved,
  editingIdea,
}: DateIdeaDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingIdea) {
        setName(editingIdea.name);
        setDescription(editingIdea.description || "");
        setReview(editingIdea.review || "");
      } else {
        setName("");
        setDescription("");
        setReview("");
      }
    }
  }, [open, editingIdea]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter a name");
      return;
    }

    setIsSubmitting(true);

    try {
      const isEditing = !!editingIdea;
      const url = isEditing ? `/api/date-ideas/${editingIdea.id}` : "/api/date-ideas";
      const method = isEditing ? "PUT" : "POST";

      const body: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim() || null,
      };
      if (isEditing && editingIdea.completed) {
        body.review = review.trim() || null;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setName("");
        setDescription("");
        setReview("");
        onOpenChange(false);
        onSaved?.();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save date idea");
      }
    } catch {
      alert("Failed to save date idea");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName("");
      setDescription("");
      setReview("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingIdea ? "Edit Date Idea" : "New Date Idea"}</DialogTitle>
          <DialogDescription>
            {editingIdea ? "Update this idea" : "Add a new date idea"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="name"
              placeholder="Date idea..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              placeholder="Optional details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {editingIdea?.completed && (
            <div className="space-y-2">
              <label htmlFor="review" className="text-sm font-medium">
                Review
              </label>
              <Textarea
                id="review"
                placeholder="How did it go?"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          )}

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
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### Task 13: Create Date Idea review dialog component

**Files:**
- Create: `src/components/date-idea-review-dialog.tsx`

- [ ] **Step 1: Create the review dialog**

Create `src/components/date-idea-review-dialog.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DateIdeaReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ideaId: string;
  ideaName: string;
  onSaved?: () => void;
}

export function DateIdeaReviewDialog({
  open,
  onOpenChange,
  ideaId,
  ideaName,
  onSaved,
}: DateIdeaReviewDialogProps) {
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async (includeReview: boolean) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/date-ideas/${ideaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completed: true,
          review: includeReview ? review.trim() || null : null,
        }),
      });

      if (response.ok) {
        setReview("");
        onOpenChange(false);
        onSaved?.();
      } else {
        alert("Failed to mark as done");
      }
    } catch {
      alert("Failed to mark as done");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) setReview("");
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Mark as Done</DialogTitle>
          <DialogDescription>
            How was &quot;{ideaName}&quot;? Write a quick note (optional).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Textarea
            placeholder="How did it go?"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            className="min-h-[100px]"
          />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleComplete(false)}
              disabled={isSubmitting}
            >
              Skip
            </Button>
            <Button
              type="button"
              onClick={() => handleComplete(true)}
              disabled={isSubmitting}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Task 14: Create Date Ideas page

**Files:**
- Create: `src/app/date-ideas/page.tsx`

- [ ] **Step 1: Create the date ideas page**

Create `src/app/date-ideas/page.tsx`:

```typescript
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Pencil, Trash2, Check, Undo2, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { DateIdeaDialog } from "@/components/date-idea-dialog";
import { DateIdeaReviewDialog } from "@/components/date-idea-review-dialog";

interface DateIdea {
  id: string;
  name: string;
  description: string | null;
  completed: boolean;
  completed_at: string | null;
  review: string | null;
  created_at: string;
}

export default function DateIdeasPage() {
  const [ideas, setIdeas] = useState<DateIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<DateIdea | null>(null);
  const [reviewingIdea, setReviewingIdea] = useState<DateIdea | null>(null);

  const fetchIdeas = useCallback(async () => {
    setLoadError(null);
    try {
      const response = await fetch("/api/date-ideas");
      if (response.ok) {
        const data = await response.json();
        setIdeas(data);
      } else {
        setLoadError("Failed to load date ideas.");
      }
    } catch {
      setLoadError("Failed to load date ideas.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const activeIdeas = useMemo(() => ideas.filter((i) => !i.completed), [ideas]);
  const completedIdeas = useMemo(() => ideas.filter((i) => i.completed), [ideas]);

  const handleRevert = async (id: string) => {
    try {
      const response = await fetch(`/api/date-ideas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: false }),
      });
      if (response.ok) fetchIdeas();
    } catch {
      alert("Failed to revert");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this idea?")) return;
    try {
      const response = await fetch(`/api/date-ideas/${id}`, { method: "DELETE" });
      if (response.ok) fetchIdeas();
      else alert("Failed to delete idea");
    } catch {
      alert("Failed to delete idea");
    }
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
          <h1 className="text-3xl font-bold text-foreground">Date Ideas</h1>
          <Button
            onClick={() => {
              setEditingIdea(null);
              setIsDialogOpen(true);
            }}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            + Add Idea
          </Button>
        </div>

        {activeIdeas.length === 0 && completedIdeas.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No date ideas yet. Add your first idea to get started!
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {activeIdeas.map((idea) => (
                <div
                  key={idea.id}
                  className="flex items-center gap-3 rounded-lg border bg-card p-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground">{idea.name}</div>
                    {idea.description && (
                      <div className="text-sm text-muted-foreground truncate">
                        {idea.description}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setReviewingIdea(idea)}
                      className="h-8 w-8 text-accent hover:text-accent/90 hover:bg-accent/10"
                      title="Mark as done"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingIdea(idea);
                        setIsDialogOpen(true);
                      }}
                      className="h-8 w-8 text-primary hover:text-primary/90 hover:bg-primary/10"
                      title="Edit idea"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(idea.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      title="Delete idea"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {completedIdeas.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${showCompleted ? "rotate-90" : ""}`}
                  />
                  Show completed dates ({completedIdeas.length})
                </button>

                {showCompleted && (
                  <div className="mt-3 space-y-2 opacity-60">
                    {completedIdeas.map((idea) => (
                      <div
                        key={idea.id}
                        className="flex items-center gap-3 rounded-lg border bg-card p-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-muted-foreground line-through">
                            {idea.name}
                          </div>
                          {idea.review && (
                            <div className="text-sm text-accent italic mt-1">
                              &quot;{idea.review}&quot;
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            Completed {idea.completed_at ? format(new Date(idea.completed_at), "MMM d, yyyy") : ""}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRevert(idea.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Move back to ideas"
                        >
                          <Undo2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <DateIdeaDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingIdea(null);
        }}
        onSaved={fetchIdeas}
        editingIdea={editingIdea}
      />

      {reviewingIdea && (
        <DateIdeaReviewDialog
          open={!!reviewingIdea}
          onOpenChange={(open) => {
            if (!open) setReviewingIdea(null);
          }}
          ideaId={reviewingIdea.id}
          ideaName={reviewingIdea.name}
          onSaved={fetchIdeas}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/date-idea-dialog.tsx src/components/date-idea-review-dialog.tsx src/app/date-ideas/
git commit -m "feat: add Date Ideas page with create/edit/review dialogs"
```

---

## Chunk 8: Doc Links Dialog Component and Page

### Task 15: Create Doc Link dialog component

**Files:**
- Create: `src/components/doc-link-dialog.tsx`

- [ ] **Step 1: Create the doc link dialog**

Create `src/components/doc-link-dialog.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Tag {
  id: string;
  name: string;
}

interface DocLink {
  id: string;
  title: string;
  url: string;
  description: string | null;
  tags: Tag[];
}

interface DocLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  editingLink?: DocLink | null;
}

export function DocLinkDialog({
  open,
  onOpenChange,
  onSaved,
  editingLink,
}: DocLinkDialogProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingLink) {
        setTitle(editingLink.title);
        setUrl(editingLink.url);
        setDescription(editingLink.description || "");
        setTagsInput(editingLink.tags.map((t) => t.name).join(", "));
      } else {
        setTitle("");
        setUrl("");
        setDescription("");
        setTagsInput("");
      }
    }
  }, [open, editingLink]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }
    if (!url.trim()) {
      alert("Please enter a URL");
      return;
    }

    setIsSubmitting(true);

    try {
      const isEditing = !!editingLink;
      const endpoint = isEditing ? `/api/doc-links/${editingLink.id}` : "/api/doc-links";
      const method = isEditing ? "PUT" : "POST";

      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          url: url.trim(),
          description: description.trim() || null,
          tags,
        }),
      });

      if (response.ok) {
        setTitle("");
        setUrl("");
        setDescription("");
        setTagsInput("");
        onOpenChange(false);
        onSaved?.();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save doc link");
      }
    } catch {
      alert("Failed to save doc link");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setTitle("");
      setUrl("");
      setDescription("");
      setTagsInput("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingLink ? "Edit Doc Link" : "New Doc Link"}</DialogTitle>
          <DialogDescription>
            {editingLink ? "Update this link" : "Add a new document link"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="title"
              placeholder="Document title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-medium">
              URL
            </label>
            <Input
              id="url"
              placeholder="https://docs.google.com/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              placeholder="Optional description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="tags" className="text-sm font-medium">
              Tags
            </label>
            <Input
              id="tags"
              placeholder="Comma-separated tags, e.g. Planning, Finance"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
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
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### Task 16: Create Doc Links page

**Files:**
- Create: `src/app/doc-links/page.tsx`

- [ ] **Step 1: Create the doc links page**

Create `src/app/doc-links/page.tsx`:

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocLinkDialog } from "@/components/doc-link-dialog";

interface Tag {
  id: string;
  name: string;
}

interface DocLink {
  id: string;
  title: string;
  url: string;
  description: string | null;
  tags: Tag[];
  created_at: string;
}

export default function DocLinksPage() {
  const [links, setLinks] = useState<DocLink[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<DocLink | null>(null);

  const fetchLinks = useCallback(async (tag?: string | null) => {
    setLoadError(null);
    try {
      const params = new URLSearchParams();
      if (tag) params.append("tag", tag);
      const response = await fetch(`/api/doc-links?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setLinks(data);
      } else {
        setLoadError("Failed to load doc links.");
      }
    } catch {
      setLoadError("Failed to load doc links.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch("/api/tags");
      if (response.ok) {
        const data = await response.json();
        setAllTags(data);
      }
    } catch {
      // Failed to fetch tags
    }
  }, []);

  useEffect(() => {
    fetchLinks(selectedTag);
    fetchTags();
  }, [fetchLinks, fetchTags, selectedTag]);

  const handleTagFilter = (tag: string | null) => {
    setSelectedTag(tag);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this link?")) return;
    try {
      const response = await fetch(`/api/doc-links/${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchLinks(selectedTag);
        fetchTags();
      } else {
        alert("Failed to delete link");
      }
    } catch {
      alert("Failed to delete link");
    }
  };

  const handleSaved = () => {
    fetchLinks(selectedTag);
    fetchTags();
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
          <h1 className="text-3xl font-bold text-foreground">Doc Links</h1>
          <Button
            onClick={() => {
              setEditingLink(null);
              setIsDialogOpen(true);
            }}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            + Add Link
          </Button>
        </div>

        {/* Tag filter bar */}
        {allTags.length > 0 && (
          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={() => handleTagFilter(null)}
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
                onClick={() => handleTagFilter(tag.name)}
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

        {links.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {selectedTag
              ? `No doc links with tag "${selectedTag}".`
              : "No doc links yet. Add your first link to get started!"}
          </div>
        ) : (
          <div className="space-y-2">
            {links.map((link) => (
              <div
                key={link.id}
                className="flex items-center gap-3 rounded-lg border bg-card p-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-primary hover:underline"
                    >
                      {link.title}
                    </a>
                    {link.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="bg-secondary text-muted-foreground rounded-full px-2 py-0.5 text-xs"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                  {link.description && (
                    <div className="text-sm text-muted-foreground truncate mt-1">
                      {link.description}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingLink(link);
                      setIsDialogOpen(true);
                    }}
                    className="h-8 w-8 text-primary hover:text-primary/90 hover:bg-primary/10"
                    title="Edit link"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(link.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                    title="Delete link"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DocLinkDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingLink(null);
        }}
        onSaved={handleSaved}
        editingLink={editingLink}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/doc-link-dialog.tsx src/app/doc-links/
git commit -m "feat: add Doc Links page with tag filtering and create/edit dialog"
```

---

## Chunk 9: Final Verification

### Task 17: End-to-end verification

- [ ] **Step 1: Start dev server and verify all pages load**

Run:
```bash
npm run dev
```

Visit each page and verify:
- `/tasks` — loads, can create/edit/delete/complete/uncomplete tasks
- `/date-ideas` — loads, can create/edit/delete/mark done with review/revert
- `/doc-links` — loads, can create/edit/delete, tag filtering works
- Sidebar shows all 7 navigation items with correct icons and active states

- [ ] **Step 2: Verify build succeeds**

Run:
```bash
npm run build
```

Expected: Build completes with no errors.

- [ ] **Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address any issues found during verification"
```
