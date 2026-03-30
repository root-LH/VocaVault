import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const topics = searchParams.get("topics");
    
    let whereClause = {};
    if (topics) {
      const topicIds = topics.split(",").filter(id => id.trim() !== "");
      if (topicIds.length > 0) {
        whereClause = {
          topicId: {
            in: topicIds
          }
        };
      }
    }

    const words = await prisma.word.findMany({
      where: whereClause,
      include: {
        topic: {
          select: {
            name: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(words);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch words" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { word, definition, example, topicId } = body;

    if (!word || !definition || !topicId) {
      return NextResponse.json(
        { error: "Word, definition and topicId are required" },
        { status: 400 }
      );
    }

    const newWord = await prisma.word.create({
      data: { word, definition, example, topicId },
    });

    return NextResponse.json(newWord);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create word" }, { status: 500 });
  }
}
