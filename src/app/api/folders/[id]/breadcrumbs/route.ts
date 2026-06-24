import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const breadcrumbs = [];
    let currentId = params.id;

    while (currentId) {
      const folder = await prisma.folder.findUnique({
        where: { id: currentId },
        select: { id: true, name: true, parentId: true }
      });

      if (!folder) break;

      breadcrumbs.unshift({ id: folder.id, name: folder.name });
      currentId = folder.parentId as string;
    }

    return NextResponse.json(breadcrumbs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch breadcrumbs" }, { status: 500 });
  }
}
