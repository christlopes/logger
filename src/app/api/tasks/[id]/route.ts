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
      include: { tags: true },
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
    const { title, notes, due_date, completed, tags } = body;

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
    if (tags !== undefined) {
      const tagConnections = Array.isArray(tags)
        ? tags
            .map((t: string) => t.trim())
            .filter((t: string) => t.length > 0)
            .map((t: string) => ({
              where: { name: t },
              create: { name: t },
            }))
        : [];
      data.tags = { set: [], connectOrCreate: tagConnections };
    }

    const task = await prisma.task.update({
      where: { id },
      data,
      include: { tags: true },
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
