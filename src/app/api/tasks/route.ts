import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const completed = searchParams.get("completed");

    const tag = searchParams.get("tag");

    const where: Record<string, unknown> = {};
    if (completed !== null) {
      where.completed = completed === "true";
    }
    if (tag) {
      where.tags = { some: { name: tag } };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: { tags: true },
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
    const { title, notes, due_date, tags } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required" },
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

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        notes: notes?.trim() || null,
        due_date: due_date ? new Date(due_date) : null,
        tags: { connectOrCreate: tagConnections },
      },
      include: { tags: true },
    });

    return NextResponse.json(task, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
