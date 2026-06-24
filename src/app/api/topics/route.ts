import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const topics = await prisma.topic.findMany({
      include: {
        _count: {
          select: { words: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(topics);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch topics" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, folderId, words } = body;

    if (!name) {
      return NextResponse.json({ error: "Topic name is required" }, { status: 400 });
    }

    const data: any = {
      name,
      description,
      folderId: folderId || null,
    };

    if (Array.isArray(words) && words.length > 0) {
      data.words = {
        create: words.map((w: any) => ({
          word: String(w.word || "").trim(),
          definition: String(w.definition || "").trim(),
          example: w.example ? String(w.example).trim() : null,
        })).filter((w: any) => w.word && w.definition)
      };
    }

    const newTopic = await prisma.topic.create({
      data,
    });

    return NextResponse.json(newTopic);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create topic" }, { status: 500 });
  }
}
