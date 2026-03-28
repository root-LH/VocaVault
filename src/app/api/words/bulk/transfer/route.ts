import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { wordIds, targetTopicId, mode } = await request.json();

    if (!wordIds || !targetTopicId || !mode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (mode === "move") {
      // 기존 단어들의 topicId만 업데이트
      await prisma.word.updateMany({
        where: {
          id: { in: wordIds },
        },
        data: {
          topicId: targetTopicId,
        },
      });
      return NextResponse.json({ message: "Words moved successfully" });
    } else if (mode === "copy") {
      // 선택된 단어들을 가져와서 새로운 데이터로 생성
      const wordsToCopy = await prisma.word.findMany({
        where: {
          id: { in: wordIds },
        },
      });

      const newWords = wordsToCopy.map((w) => ({
        word: w.word,
        definition: w.definition,
        example: w.example,
        topicId: targetTopicId,
      }));

      await prisma.word.createMany({
        data: newWords,
      });

      return NextResponse.json({ message: "Words copied successfully" });
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (error) {
    console.error("Bulk transfer error:", error);
    return NextResponse.json({ error: "Failed to transfer words" }, { status: 500 });
  }
}
