import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const words = await prisma.word.findMany({
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
    const { word, definition, example } = body;

    if (!word || !definition) {
      return NextResponse.json(
        { error: "Word and definition are required" },
        { status: 400 }
      );
    }

    const newWord = await prisma.word.create({
      data: { word, definition, example },
    });

    return NextResponse.json(newWord);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create word" }, { status: 500 });
  }
}
