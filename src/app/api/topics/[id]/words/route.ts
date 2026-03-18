import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: topicId } = params;
    const body = await request.json();
    const { word, definition, example } = body;

    if (!word || !definition) {
      return NextResponse.json(
        { error: "Word and definition are required" },
        { status: 400 }
      );
    }

    const newWord = await prisma.word.create({
      data: { 
        word, 
        definition, 
        example,
        topicId
      },
    });

    return NextResponse.json(newWord);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create word" }, { status: 500 });
  }
}
