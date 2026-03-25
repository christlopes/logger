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
