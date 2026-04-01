import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const folder = await prisma.folder.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { subFolders: true, topics: true }
        }
      }
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    return NextResponse.json(folder);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch folder" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, parentId } = body;

    const updatedFolder = await prisma.folder.update({
      where: { id: params.id },
      data: { 
        name,
        parentId: parentId === undefined ? undefined : (parentId || null)
      },
    });

    return NextResponse.json(updatedFolder);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update folder" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Cascade delete is handled by Prisma (onDelete: Cascade in schema)
    await prisma.folder.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Folder deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 });
  }
}
