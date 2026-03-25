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
