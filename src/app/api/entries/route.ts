import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchDate = searchParams.get("date");
    const searchType = searchParams.get("type");
    const searchDifficulty = searchParams.get("difficulty");

    const where: Prisma.EntryWhereInput = {};

    if (searchDate) {
      const date = new Date(searchDate);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      where.date = {
        gte: date,
        lt: nextDay,
      };
    }

    if (searchType) {
      where.type = {
        name: {
          contains: searchType,
          mode: "insensitive",
        },
      };
    }

    if (searchDifficulty) {
      where.difficulty = searchDifficulty;
    }

    const entries = await prisma.entry.findMany({
      where,
      include: {
        type: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(entries);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch entries" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, typeId, notes, difficulty } = body;

    if (!date || !typeId) {
      return NextResponse.json(
        { error: "Date and type are required" },
        { status: 400 }
      );
    }

    const entry = await prisma.entry.create({
      data: {
        date: new Date(date),
        type_id: typeId,
        notes: notes || null,
        difficulty: difficulty || "Medium",
      },
      include: {
        type: true,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create entry" },
      { status: 500 }
    );
  }
}

