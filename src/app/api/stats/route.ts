import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getLevelFromExp } from "@/lib/xp";

export async function GET() {
  try {
    const stats = await prisma.userStats.upsert({
      where: { id: "global-stats" },
      update: {},
      create: { id: "global-stats" },
    });
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { expToAdd, wordAdded, quizCompleted } = await request.json();

    const currentStats = await prisma.userStats.upsert({
      where: { id: "global-stats" },
      update: {},
      create: { id: "global-stats" },
    });

    const newTotalExp = currentStats.totalExp + (expToAdd || 0);
    const newLevel = getLevelFromExp(newTotalExp);
    const isLevelUp = newLevel > currentStats.level;

    const updatedStats = await prisma.userStats.update({
      where: { id: "global-stats" },
      data: {
        totalExp: newTotalExp,
        level: newLevel,
        wordsAdded: { increment: wordAdded ? 1 : 0 },
        quizzesCompleted: { increment: quizCompleted ? 1 : 0 },
      },
    });

    return NextResponse.json({ ...updatedStats, isLevelUp });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update stats" }, { status: 500 });
  }
}
