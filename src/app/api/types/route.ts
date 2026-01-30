import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const types = await prisma.entryType.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(types);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch types" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Type name is required" },
        { status: 400 }
      );
    }

    const entryType = await prisma.entryType.create({
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json(entryType, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { error: "Type name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create type" },
      { status: 500 }
    );
  }
}



