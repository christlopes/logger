import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const tags = await prisma.taskTag.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(tags);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch task tags" },
      { status: 500 }
    );
  }
}
