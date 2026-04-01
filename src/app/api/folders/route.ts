import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');

    // Fetch folders and topics for the given parent folder (or root if parentId is null)
    const folders = await prisma.folder.findMany({
      where: { parentId: parentId === 'null' ? null : parentId },
      include: {
        _count: {
          select: { topics: true, subFolders: true }
        }
      },
      orderBy: { name: "asc" },
    });

    const topics = await prisma.topic.findMany({
      where: { folderId: parentId === 'null' ? null : parentId },
      include: {
        _count: {
          select: { words: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ folders, topics });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch folders and topics" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, parentId } = body;

    if (!name) {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
    }

    const newFolder = await prisma.folder.create({
      data: { 
        name, 
        parentId: parentId || null 
      },
    });

    return NextResponse.json(newFolder);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
  }
}
