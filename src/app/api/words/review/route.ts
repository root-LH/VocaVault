import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getFolderTopicIdsRecursive } from "@/lib/folders";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get("folder");
    
    const now = new Date();
    // 시간 비교를 위해 오늘 날짜 23:59:59까지 포함하도록 설정
    now.setHours(23, 59, 59, 999);

    let whereClause: any = {
      nextReviewAt: {
        lte: now, // 현재 시간보다 이전이거나 오늘까지인 단어들
      },
    };

    if (folder) {
      const topicIds = await getFolderTopicIdsRecursive(folder);
      whereClause.topicId = {
        in: topicIds
      };
    }

    const reviewWords = await prisma.word.findMany({
      where: whereClause,
      include: {
        topic: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        nextReviewAt: "asc",
      },
    });

    return NextResponse.json(reviewWords);
  } catch (error) {
    console.error("Failed to fetch review words:", error);
    return NextResponse.json({ error: "Failed to fetch review words" }, { status: 500 });
  }
}
