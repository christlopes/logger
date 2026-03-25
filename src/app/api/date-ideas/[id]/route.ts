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
