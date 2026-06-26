import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getFolderTopicIdsRecursive } from "@/lib/folders";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get("folder");

    let whereClause: any = {
      missedCount: { gt: 0 }
    };

    if (folder) {
      const topicIds = await getFolderTopicIdsRecursive(folder);
      whereClause.topicId = {
        in: topicIds
      };
    }

    const weakWords = await prisma.word.findMany({
      where: whereClause,
      orderBy: [
        { missedCount: 'desc' },
        { correctCount: 'asc' }
      ],
      take: 20
    });
    return NextResponse.json(weakWords);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch weak words" }, { status: 500 });
  }
}
