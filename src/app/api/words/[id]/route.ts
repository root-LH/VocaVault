import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { word, definition, example } = body;

    const updatedWord = await prisma.word.update({
      where: { id },
      data: { word, definition, example },
    });

    return NextResponse.json(updatedWord);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update word" }, { status: 500 });
  }
}

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
