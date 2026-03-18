import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const weakWords = await prisma.word.findMany({
      where: {
        missedCount: { gt: 0 }
      },
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
