import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const vocabulary = await prisma.vocabulary.findMany({
      include: {
        entry: {
          include: {
            type: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return NextResponse.json(vocabulary);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch vocabulary" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entryId, vocabulary: vocabItems } = body;

    if (!entryId || !Array.isArray(vocabItems)) {
      return NextResponse.json(
        { error: "Entry ID and vocabulary array are required" },
        { status: 400 }
      );
    }

    // Filter out empty vocabulary items
    const validVocab = vocabItems.filter(
      (v: { word: string; meaning: string }) =>
        v.word.trim() && v.meaning.trim()
    );

    if (validVocab.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // Create all vocabulary entries
    const created = await prisma.vocabulary.createMany({
      data: validVocab.map((v: { word: string; meaning: string }) => ({
        word: v.word.trim(),
        meaning: v.meaning.trim(),
        entry_id: entryId,
      })),
    });

    return NextResponse.json({ success: true, count: created.count });
  } catch {
    return NextResponse.json(
      { error: "Failed to create vocabulary" },
      { status: 500 }
    );
  }
}



