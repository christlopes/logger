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
