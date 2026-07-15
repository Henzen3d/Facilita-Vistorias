import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { promises as fs } from "fs";
import path from "path";
import { TipoMidia, SyncStatus } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id: vistoriaId, itemId } = resolvedParams;

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const tipoStr = formData.get("tipo") as "FOTO" | "AUDIO";
    const midiaId = formData.get("id") as string || `mid-${Date.now()}`;

    if (!file || !tipoStr) {
      return NextResponse.json({ error: "Arquivo ou tipo ausente" }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Setup local uploads directory for development/testing
    const uploadDir = path.join(process.cwd(), "public", "uploads", vistoriaId);
    await fs.mkdir(uploadDir, { recursive: true });

    // Format file name
    const ext = tipoStr === "AUDIO" ? ".webm" : ".jpg";
    const filename = `${midiaId}${ext}`;
    const filePath = path.join(uploadDir, filename);

    // Save file
    await fs.writeFile(filePath, buffer);

    const fileUrl = `/uploads/${vistoriaId}/${filename}`;
    const storageKey = `${itemId}/${filename}`;

    const tipo = tipoStr === "AUDIO" ? TipoMidia.AUDIO : TipoMidia.FOTO;

    // Create record in Prisma DB
    const newMidia = await prisma.midia.create({
      data: {
        id: midiaId,
        tipo,
        url: fileUrl,
        key: storageKey,
        itemId,
        syncStatus: SyncStatus.SYNCED,
      },
    });

    return NextResponse.json(newMidia, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao fazer upload de mídia:", error);
    return NextResponse.json(
      { error: "Erro ao fazer upload de mídia", details: error.message },
      { status: 500 }
    );
  }
}
