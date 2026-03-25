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
