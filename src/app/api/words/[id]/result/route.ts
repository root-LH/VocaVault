import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { isCorrect } = await request.json();

    // 1. 현재 단어 정보 가져오기
    const word = await prisma.word.findUnique({
      where: { id },
      select: { interval: true, easeFactor: true }
    });

    if (!word) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 });
    }

    let { interval, easeFactor } = word;
    let nextReviewAt = new Date();

    if (isCorrect) {
      // 정답 시 간격 계산 (SM-2 알고리즘 변형)
      if (interval === 0) {
        interval = 1; // 1일 후 첫 복습
      } else if (interval === 1) {
        interval = 6; // 6일 후 두 번째 복습
      } else {
        interval = Math.round(interval * easeFactor);
      }
      
      // 최대 복습 간격은 365일로 제한
      if (interval > 365) interval = 365;
      
      // 맞추면 난이도 가중치 유지 또는 소폭 상승 (최대 2.5)
      easeFactor = Math.min(2.5, easeFactor + 0.1);
    } else {
      // 오답 시 간격 초기화 (다시 1일 후부터 시작)
      interval = 0;
      
      // 틀리면 난이도 가중치 하락 (최소 1.3)
      easeFactor = Math.max(1.3, easeFactor - 0.2);
    }

    // 다음 복습 일시 계산 (현재 시간 + interval 일)
    nextReviewAt.setDate(nextReviewAt.getDate() + interval);
    // 정확한 날짜 비교를 위해 시간은 00:00:00으로 초기화
    nextReviewAt.setHours(0, 0, 0, 0);

    const updatedWord = await prisma.word.update({
      where: { id },
      data: {
        correctCount: { increment: isCorrect ? 1 : 0 },
        missedCount: isCorrect ? 0 : { increment: 1 },
        interval,
        easeFactor,
        nextReviewAt,
      },
    });

    return NextResponse.json(updatedWord);
  } catch (error) {
    console.error("SRS calculation error:", error);
    return NextResponse.json({ error: "Failed to update SRS performance" }, { status: 500 });
  }
}
