import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getLevelFromExp } from "@/lib/xp";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { words } = await request.json();

    if (!Array.isArray(words) || words.length === 0) {
      return NextResponse.json({ error: "No words provided" }, { status: 400 });
    }

    // 데이터 유효성 검사 및 토픽 ID 연결 준비
    const wordsToData = words.map((w: any) => ({
      word: String(w.word || "").trim(),
      definition: String(w.definition || "").trim(),
      example: w.example ? String(w.example).trim() : null,
      topicId: params.id,
    })).filter(w => w.word && w.definition);

    if (wordsToData.length === 0) {
      return NextResponse.json({ error: "No valid words to import" }, { status: 400 });
    }

    const created = await prisma.word.createMany({
      data: wordsToData,
    });

    // 통계 업데이트 (userStats 모델 및 global-stats ID 사용)
    const expToAdd = created.count * 5;
    
    const currentStats = await prisma.userStats.upsert({
      where: { id: "global-stats" },
      update: {},
      create: { id: "global-stats" },
    });

    const newTotalExp = currentStats.totalExp + expToAdd;
    const newLevel = getLevelFromExp(newTotalExp);

    await prisma.userStats.update({
      where: { id: "global-stats" },
      data: { 
        totalExp: newTotalExp,
        level: newLevel,
        wordsAdded: { increment: created.count }
      },
    });

    return NextResponse.json({ 
      message: `${created.count} words imported successfully`,
      count: created.count,
      expGained: expToAdd
    });
  } catch (error: any) {
    console.error("Bulk import error:", error);
    return NextResponse.json({ 
      error: "Failed to import words", 
      details: error.message 
    }, { status: 500 });
  }
}
