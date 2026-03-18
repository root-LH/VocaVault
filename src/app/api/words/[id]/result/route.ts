import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { isCorrect } = await request.json();

    const updatedWord = await prisma.word.update({
      where: { id },
      data: {
        correctCount: { increment: isCorrect ? 1 : 0 },
        missedCount: { increment: isCorrect ? 0 : 1 },
      },
    });

    return NextResponse.json(updatedWord);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update word performance" }, { status: 500 });
  }
}
