import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await prisma.word.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Word deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete word" }, { status: 500 });
  }
}
