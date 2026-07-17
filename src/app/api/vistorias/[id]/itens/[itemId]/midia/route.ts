import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { promises as fs } from "fs";
import path from "path";
import { TipoMidia, SyncStatus, StatusItem } from "@prisma/client";
import { enqueueAiDescribeItem } from "@/lib/queue/queues";
import { rejectIfAssinado } from "@/lib/report/hard-lock";

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

    const locked = await rejectIfAssinado(vistoriaId);
    if (locked) return locked;

    // T-03-09: bind item to path vistoriaId before create
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        ambiente: {
          select: {
            vistoriaId: true,
            vistoria: { select: { empresaId: true } },
          },
        },
      },
    });

    if (!item || !item.ambiente || item.ambiente.vistoriaId !== vistoriaId) {
      return NextResponse.json(
        { error: "Item não encontrado nesta vistoria" },
        { status: 404 },
      );
    }

    const sessionEmpresaId = (session.user as { empresaId?: string } | undefined)
      ?.empresaId;
    if (
      sessionEmpresaId &&
      item.ambiente.vistoria.empresaId &&
      sessionEmpresaId !== item.ambiente.vistoria.empresaId
    ) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const tipoStr = formData.get("tipo") as "FOTO" | "AUDIO";
    const midiaId = (formData.get("id") as string) || `mid-${Date.now()}`;

    if (!file || !tipoStr) {
      return NextResponse.json(
        { error: "Arquivo ou tipo ausente" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadDir = path.join(process.cwd(), "public", "uploads", vistoriaId);
    await fs.mkdir(uploadDir, { recursive: true });

    const ext = tipoStr === "AUDIO" ? ".webm" : ".jpg";
    const filename = `${midiaId}${ext}`;
    const filePath = path.join(uploadDir, filename);

    await fs.writeFile(filePath, buffer);

    const fileUrl = `/uploads/${vistoriaId}/${filename}`;
    const storageKey = `${itemId}/${filename}`;

    const tipo = tipoStr === "AUDIO" ? TipoMidia.AUDIO : TipoMidia.FOTO;

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

    // Mark item CAPTURADO after successful media write (D-05/D-06 path)
    if (
      item.status === StatusItem.PENDENTE ||
      item.status === StatusItem.CAPTURADO
    ) {
      await prisma.item.update({
        where: { id: itemId },
        data: { status: StatusItem.CAPTURADO },
      });
    }

    // D-05/D-06: enqueue AI only when both FOTO and AUDIO exist
    const midias = await prisma.midia.findMany({
      where: { itemId },
      select: { tipo: true },
    });
    const hasFoto = midias.some((m) => m.tipo === TipoMidia.FOTO);
    const hasAudio = midias.some((m) => m.tipo === TipoMidia.AUDIO);

    let aiEnqueue = false;
    if (hasFoto && hasAudio) {
      try {
        await enqueueAiDescribeItem({ itemId, vistoriaId });
        aiEnqueue = true;
      } catch (enqueueErr) {
        // Media save is source of truth — do not fail the upload if Redis is down
        console.error(
          "[midia POST] enqueueAiDescribeItem failed",
          enqueueErr instanceof Error ? enqueueErr.message : enqueueErr,
        );
        aiEnqueue = false;
      }
    }

    return NextResponse.json(
      { ...newMidia, aiEnqueue },
      { status: 201 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Erro ao fazer upload de mídia:", error);
    return NextResponse.json(
      { error: "Erro ao fazer upload de mídia", details: message },
      { status: 500 },
    );
  }
}
